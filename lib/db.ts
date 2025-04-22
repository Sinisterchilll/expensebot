import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'expenses.db'));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    userPhone TEXT NOT NULL,
    message TEXT NOT NULL,
    amount INTEGER NOT NULL,
    category TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function addExpense(expense: { userPhone: string; message: string; amount: number; category: string }) {
  const stmt = db.prepare(`
    INSERT INTO expenses (id, userPhone, message, amount, category)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const id = Math.random().toString(36).substring(7);
  stmt.run(id, expense.userPhone, expense.message, expense.amount, expense.category);
  return id;
}

export function getExpenses(userPhone: string) {
  const stmt = db.prepare(`
    SELECT * FROM expenses 
    WHERE userPhone = ? 
    ORDER BY createdAt DESC 
    LIMIT 10
  `);
  
  return stmt.all(userPhone);
} 