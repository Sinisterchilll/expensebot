import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/gemini';
import { getExpenses } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { phone, query, platform = 'whatsapp' } = await request.json();
    
    if (!phone || !query) {
      return NextResponse.json(
        { error: 'Phone and query are required' },
        { status: 400 }
      );
    }
    
    // Get user's expense history
    const expenses = await getExpenses(phone, platform as 'whatsapp' | 'telegram');
    
    // Get response from Gemini
    const response = await getGeminiResponse(query, expenses);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 