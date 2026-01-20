export type TransactionType = 'income' | 'expense';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
export type BankProvider = 'monobank' | 'plaid' | 'nordigen';
export type ConnectionStatus = 'active' | 'expired' | 'error' | 'disconnected';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type AchievementCategory = 'savings' | 'spending' | 'streak' | 'social' | 'milestone';
export type SyncOperation = 'insert' | 'update' | 'delete';

export interface Transaction {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  accountId?: string;
  mccCode?: string;
  bankTransactionId?: string;
  isSynced?: boolean;
  updatedAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  icon: string;
  color: string;
  isDefault: boolean;
  bankConnectionId?: string;
  externalAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankConnection {
  id: string;
  userId: string;
  provider: BankProvider;
  accessToken?: string;
  refreshToken?: string;
  institutionId?: string;
  institutionName?: string;
  status: ConnectionStatus;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  spent?: number;
}

export interface BudgetHistory {
  id: string;
  budgetId: string;
  month: string;
  spentAmount: number;
  limitAmount: number;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId?: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  lastCreatedAt?: string;
  isActive: boolean;
  reminderDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  createdAt?: string;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  requirementType: string;
  requirementValue: number;
  isSecret: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  achievement?: Achievement;
}

export interface UserStats {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  totalTransactions: number;
  totalSaved: number;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId?: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'expired';
  rewardClaimed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  userId: string;
  tableName: string;
  operation: SyncOperation;
  recordId: string;
  payload: Record<string, unknown>;
  synced: boolean;
  createdAt: string;
  syncedAt?: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  budgetAlerts: boolean;
  recurringReminders: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  preferredCurrency: string;
  referralCode?: string;
  notificationPreferences: NotificationPreferences;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
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
