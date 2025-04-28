import { NextResponse } from 'next/server';
import { extractAmount } from '@/lib/utils';
import { getGeminiResponse, classifyMessage, categorizeExpenseWithGemini } from '@/lib/gemini';
import { addExpense, getExpenses } from '@/lib/supabase';
import { sendMessage } from '@/lib/telegram';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received Telegram webhook payload:', JSON.stringify(body, null, 2));
    
    const message = body.message;
    if (!message) {
      return NextResponse.json({ success: true });
    }
    
    const chatId = message.chat.id.toString();
    const messageText = message.text;
    
    if (!messageText) {
      console.log('Received message without text');
      return NextResponse.json({ success: true });
    }
    
    console.log('Processing message:', { chatId, messageText });
    
    // Use Gemini to classify the message
    const messageType = await classifyMessage(messageText);
    console.log('Message classified as:', messageType);
    
    if (messageType === 'query') {
      try {
        console.log('Processing as query');
        // Get user's expense history
        const expenses = await getExpenses(chatId, 'telegram');
        console.log('Retrieved expenses:', expenses);
        
        // Get response from Gemini
        const response = await getGeminiResponse(messageText, expenses);
        console.log('Gemini response:', response);
        await sendMessage(chatId, response);
      } catch (error) {
        console.error('Error processing query:', error);
        await sendMessage(chatId, 'Sorry, I encountered an error processing your query. Please try again later.');
      }
    } else {
      try {
        console.log('Processing as expense');
        // Process as expense
        const amount = extractAmount(messageText);
        const category = await categorizeExpenseWithGemini(messageText);
        
        console.log('Extracted expense details:', { amount, category });
        
        if (amount > 0) {
          const expenseData = {
            user_id: chatId,
            platform: 'telegram' as const,
            message: messageText,
            amount,
            category
          };
          console.log('Saving expense to database:', expenseData);
          
          const savedExpense = await addExpense(expenseData);
          console.log('Expense saved successfully:', savedExpense);
          
          await sendMessage(chatId, `Expense recorded: ₹${amount} (${category})`);
        } else {
          console.log('No valid amount found in message');
          await sendMessage(chatId, 'Could not find a valid amount in your message. Please try again.');
        }
      } catch (error) {
        console.error('Error processing expense:', error);
        await sendMessage(chatId, 'Sorry, I encountered an error recording your expense. Please try again later.');
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 