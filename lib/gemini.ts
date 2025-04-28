import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function classifyMessage(message: string): Promise<'expense' | 'query'> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Classify the following message as either an 'expense' or a 'query'. 
  An expense is a message that records a spending, like "spent 100 on coffee" or "bought groceries for 500".
  A query is a message that asks about expenses, like "show me my expenses" or "how much did I spend?".
  
  Message: "${message}"
  
  Respond with exactly one word: either 'expense' or 'query'.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toLowerCase();
    
    if (text === 'expense' || text === 'query') {
      return text;
    }
    // Default to query if Gemini's response is unclear
    return 'query';
  } catch (error) {
    console.error('Error classifying message:', error);
    // Default to query on error
    return 'query';
  }
}

export async function categorizeExpenseWithGemini(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an expense categorization assistant. Categorize the following expense into one of these categories:
food, travel, grocery, shopping, entertainment, bills, health, others.

Expense: "${text}"

Respond with only the category name, nothing else.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim().toLowerCase();
    // Validate the response
    const allowed = ['food', 'travel', 'grocery', 'shopping', 'entertainment', 'bills', 'health', 'others'];
    if (allowed.includes(category)) {
      return category;
    }
    return 'others';
  } catch (error) {
    console.error('Error categorizing expense with Gemini:', error);
    return 'others';
  }
}

export async function getGeminiResponse(query: string, expenses: any[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Based on the following user query and expense history, provide a helpful response.
  If the query asks for a total or summary, calculate it from the expense history.
  If the query asks for specific categories or time periods, filter the expenses accordingly.
  Keep the response concise and friendly.
  
  User Query: "${query}"
  
  Expense History:
  ${JSON.stringify(expenses, null, 2)}
  
  Response:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return 'Sorry, I encountered an error processing your query. Please try again later.';
  }
} 