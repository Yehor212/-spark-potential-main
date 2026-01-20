export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  translationKey: string;
  icon: string;
  type: TransactionType;
  color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', translationKey: 'categories.expense.food', icon: '🍕', type: 'expense', color: 'hsl(0 72% 51%)' },
  { id: 'transport', translationKey: 'categories.expense.transport', icon: '🚗', type: 'expense', color: 'hsl(200 80% 50%)' },
  { id: 'entertainment', translationKey: 'categories.expense.entertainment', icon: '🎮', type: 'expense', color: 'hsl(280 80% 55%)' },
  { id: 'shopping', translationKey: 'categories.expense.shopping', icon: '🛍️', type: 'expense', color: 'hsl(320 80% 55%)' },
  { id: 'health', translationKey: 'categories.expense.health', icon: '💊', type: 'expense', color: 'hsl(160 80% 45%)' },
  { id: 'utilities', translationKey: 'categories.expense.utilities', icon: '💡', type: 'expense', color: 'hsl(45 90% 50%)' },
  { id: 'education', translationKey: 'categories.expense.education', icon: '📚', type: 'expense', color: 'hsl(220 80% 55%)' },
  { id: 'other', translationKey: 'categories.expense.other', icon: '📦', type: 'expense', color: 'hsl(0 0% 50%)' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', translationKey: 'categories.income.salary', icon: '💼', type: 'income', color: 'hsl(160 84% 39%)' },
  { id: 'freelance', translationKey: 'categories.income.freelance', icon: '💻', type: 'income', color: 'hsl(200 80% 50%)' },
  { id: 'investments', translationKey: 'categories.income.investments', icon: '📈', type: 'income', color: 'hsl(280 80% 55%)' },
  { id: 'gifts', translationKey: 'categories.income.gifts', icon: '🎁', type: 'income', color: 'hsl(320 80% 55%)' },
  { id: 'other', translationKey: 'categories.income.other', icon: '✨', type: 'income', color: 'hsl(45 90% 50%)' },
];
