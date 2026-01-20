import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  Account,
  SavingsGoal,
  Budget,
  RecurringTransaction,
  UserAchievement,
  UserStats,
  SyncQueueItem,
  BankConnection,
} from '@/types/finance';

export class KopiMasterDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  savingsGoals!: Table<SavingsGoal>;
  budgets!: Table<Budget>;
  recurringTransactions!: Table<RecurringTransaction>;
  userAchievements!: Table<UserAchievement>;
  userStats!: Table<UserStats>;
  syncQueue!: Table<SyncQueueItem>;
  bankConnections!: Table<BankConnection>;

  constructor() {
    super('kopimaster');

    this.version(1).stores({
      transactions: 'id, userId, type, category, date, accountId, isSynced',
      accounts: 'id, userId, type, isDefault',
      savingsGoals: 'id, userId',
      budgets: 'id, userId, category',
      recurringTransactions: 'id, userId, nextOccurrence, isActive',
      userAchievements: 'id, [userId+achievementId]',
      userStats: 'userId',
      syncQueue: 'id, userId, synced, tableName',
    });

    // Version 2: Add bank connections
    this.version(2).stores({
      transactions: 'id, userId, type, category, date, accountId, isSynced, bankTransactionId',
      accounts: 'id, userId, type, isDefault, bankConnectionId',
      savingsGoals: 'id, userId',
      budgets: 'id, userId, category',
      recurringTransactions: 'id, userId, nextOccurrence, isActive',
      userAchievements: 'id, [userId+achievementId]',
      userStats: 'userId',
      syncQueue: 'id, userId, synced, tableName',
      bankConnections: 'id, userId, provider, status',
    });
  }
}

export const db = new KopiMasterDB();

export async function clearAllData() {
  await db.transactions.clear();
  await db.accounts.clear();
  await db.savingsGoals.clear();
  await db.budgets.clear();
  await db.recurringTransactions.clear();
  await db.userAchievements.clear();
  await db.userStats.clear();
  await db.syncQueue.clear();
  await db.bankConnections.clear();
}

export async function getUserBankConnections(userId: string): Promise<BankConnection[]> {
  return db.bankConnections.where('userId').equals(userId).toArray();
}

export async function getUnsyncedItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('synced').equals(0).toArray();
}

export async function markAsSynced(id: string) {
  await db.syncQueue.update(id, {
    synced: true,
    syncedAt: new Date().toISOString(),
  });
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'synced' | 'createdAt'>) {
  const id = crypto.randomUUID();
  await db.syncQueue.add({
    ...item,
    id,
    synced: false,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  return db.transactions.where('userId').equals(userId).toArray();
}

export async function getUserAccounts(userId: string): Promise<Account[]> {
  return db.accounts.where('userId').equals(userId).toArray();
}

export async function getUserGoals(userId: string): Promise<SavingsGoal[]> {
  return db.savingsGoals.where('userId').equals(userId).toArray();
}

export async function getUserBudgets(userId: string): Promise<Budget[]> {
  return db.budgets.where('userId').equals(userId).toArray();
}

export async function getUserRecurring(userId: string): Promise<RecurringTransaction[]> {
  return db.recurringTransactions.where('userId').equals(userId).toArray();
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  return db.userAchievements.where('userId').equals(userId).toArray();
}

export async function getUserStats(userId: string): Promise<UserStats | undefined> {
  return db.userStats.get(userId);
}

export { Dexie };
