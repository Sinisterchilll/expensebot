export function extractAmount(text: string): number {
  // Match numbers with optional ₹ symbol
  const match = text.match(/₹?\s*(\d+(?:\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : 0;
}

export function categorizeExpense(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('coffee') || lowerText.includes('tea')) return 'beverage';
  if (lowerText.includes('food') || lowerText.includes('meal') || lowerText.includes('lunch') || lowerText.includes('dinner') || lowerText.includes('breakfast')) return 'food';
  if (lowerText.includes('travel') || lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('metro')) return 'travel';
  if (lowerText.includes('grocery') || lowerText.includes('vegetable') || lowerText.includes('fruit')) return 'grocery';
  if (lowerText.includes('shopping') || lowerText.includes('clothes') || lowerText.includes('shirt') || lowerText.includes('pant')) return 'shopping';
  if (lowerText.includes('protein') || lowerText.includes('supplement')) return 'health';
  if (lowerText.includes('oat') || lowerText.includes('cereal')) return 'food';
  
  return 'other';
}

export function isQuery(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for expense patterns first
  const expensePatterns = [
    /spent\s+\d+/i,
    /paid\s+\d+/i,
    /bought\s+\d+/i,
    /purchased\s+\d+/i,
    /₹\s*\d+/i,
    /\d+\s*(rupee|rs|inr)/i,
    /add\s+\d+/i,
    /record\s+\d+/i
  ];
  
  if (expensePatterns.some(pattern => pattern.test(text))) {
    return false;
  }
  
  // Then check for query patterns
  const queryPatterns = [
    /how much/i,
    /what did/i,
    /show me/i,
    /list my/i,
    /total spent/i,
    /summary/i,
    /report/i,
    /expenses/i,
    /spending/i,
    /my total/i,
    /total expenditure/i,
    /how much did/i,
    /what's my/i,
    /what is my/i,
    /tell me my/i,
    /give me/i,
    /show my/i,
    /list expenses/i,
    /expense summary/i,
    /spending summary/i,
    /monthly expenses/i,
    /daily expenses/i,
    /weekly expenses/i,
    /expense report/i,
    /spending report/i
  ];
  
  return queryPatterns.some(pattern => pattern.test(lowerText));
} 