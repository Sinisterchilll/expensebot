import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

console.log('Initializing Supabase client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseKey);

interface Expense {
  user_id: string;
  platform: 'whatsapp' | 'telegram';
  message: string;
  amount: number;
  category: string;
  created_at?: string;
}

export async function addExpense(expense: Expense) {
  console.log('Attempting to add expense:', expense);
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      ...expense,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding expense:', error);
    throw error;
  }

  console.log('Successfully added expense:', data);
  return data;
}

export async function getExpenses(userId: string, platform: 'whatsapp' | 'telegram') {
  console.log('Fetching expenses for user:', { userId, platform });
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }

  console.log('Retrieved expenses:', data);
  return data;
}

export async function getExpensesByCategory(userId: string, platform: 'whatsapp' | 'telegram') {
  console.log('Fetching expenses by category for user:', { userId, platform });
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('user_id', userId)
    .eq('platform', platform);

  if (error) {
    console.error('Error getting expenses by category:', error);
    throw error;
  }

  // Group expenses by category
  const expensesByCategory = data.reduce((acc: Record<string, number>, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  console.log('Expenses by category:', expensesByCategory);
  return expensesByCategory;
}

export async function getExpensesByDateRange(
  userId: string, 
  platform: 'whatsapp' | 'telegram',
  startDate: string,
  endDate: string
) {
  console.log('Fetching expenses by date range:', { userId, platform, startDate, endDate });
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting expenses by date range:', error);
    throw error;
  }

  console.log('Retrieved expenses by date range:', data);
  return data;
} 