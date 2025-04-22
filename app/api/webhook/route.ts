import { NextResponse } from 'next/server';
import { extractAmount, categorizeExpense } from '@/lib/utils';
import { getGeminiResponse, classifyMessage } from '@/lib/gemini';
import { addExpense, getExpenses } from '@/lib/supabase';

const WHATSAPP_API = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendWhatsAppMessage(to: string, text: string) {
  try {
    const response = await fetch(WHATSAPP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('Webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      if (!challenge) {
        return new Response('No challenge provided', { status: 400 });
      }
      return new Response(challenge);
    }

    return new Response('Invalid verification request', { status: 403 });
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received WhatsApp webhook payload:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages?.length) {
      return NextResponse.json({ success: true });
    }

    const message = messages[0];
    const userPhone = message.from;
    const messageText = message.text?.body;

    if (!messageText) {
      console.log('Received message without text');
      return NextResponse.json({ success: true });
    }

    console.log('Processing message:', { userPhone, messageText });

    // Use Gemini to classify the message
    const messageType = await classifyMessage(messageText);
    console.log('Message classified as:', messageType);

    if (messageType === 'query') {
      try {
        console.log('Processing as query');
        // Get user's expense history
        const expenses = await getExpenses(userPhone, 'whatsapp');
        console.log('Retrieved expenses:', expenses);
        
        // Get response from Gemini
        const response = await getGeminiResponse(messageText, expenses);
        console.log('Gemini response:', response);
        await sendWhatsAppMessage(userPhone, response);
      } catch (error) {
        console.error('Error processing query:', error);
        await sendWhatsAppMessage(userPhone, 'Sorry, I encountered an error processing your query. Please try again later.');
      }
    } else {
      try {
        console.log('Processing as expense');
        // Process as expense
        const amount = extractAmount(messageText);
        const category = categorizeExpense(messageText);
        
        console.log('Extracted expense details:', { amount, category });
        
        if (amount > 0) {
          const expenseData = {
            user_id: userPhone,
            platform: 'whatsapp' as const,
            message: messageText,
            amount,
            category
          };
          console.log('Saving expense to database:', expenseData);
          
          const savedExpense = await addExpense(expenseData);
          console.log('Expense saved successfully:', savedExpense);
          
          await sendWhatsAppMessage(userPhone, `Expense recorded: ₹${amount} (${category})`);
        } else {
          console.log('No valid amount found in message');
          await sendWhatsAppMessage(userPhone, 'Could not find a valid amount in your message. Please try again.');
        }
      } catch (error) {
        console.error('Error processing expense:', error);
        await sendWhatsAppMessage(userPhone, 'Sorry, I encountered an error recording your expense. Please try again later.');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 