import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, TransactionType } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'isSynced'>
  ) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadTransactions: (userId: string) => Promise<void>;

  // Computed getters
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getTransactionsByDateRange: (start: Date, end: Date) => Transaction[];
  getMonthlyTransactions: (year: number, month: number) => Transaction[];
  getTotalIncome: () => number;
  getTotalExpense: () => number;
  getBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpense: () => number;
  getExpensesByCategory: () => Record<string, number>;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,

      setTransactions: (transactions) => set({ transactions }),

      addTransaction: async (transactionData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newTransaction: Transaction = {
          ...transactionData,
          id,
          createdAt: now,
          isSynced: false,
        };

        // Add to local state (newest first)
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));

        // Add to IndexedDB
        await db.transactions.add(newTransaction);

        // Sync to Supabase if configured
        if (isSupabaseConfigured() && transactionData.userId) {
          const { error } = await supabase.from('transactions').insert({
            id: newTransaction.id,
            user_id: transactionData.userId,
            type: newTransaction.type,
            category: newTransaction.category,
            amount: newTransaction.amount,
            description: newTransaction.description,
            date: newTransaction.date,
            account_id: newTransaction.accountId,
            mcc_code: newTransaction.mccCode,
            bank_transaction_id: newTransaction.bankTransactionId,
          });

          if (error) {
            await addToSyncQueue({
              userId: transactionData.userId,
              tableName: 'transactions',
              operation: 'insert',
              recordId: id,
              payload: newTransaction as unknown as Record<string, unknown>,
            });
          } else {
            // Mark as synced
            set((state) => ({
              transactions: state.transactions.map((t) =>
                t.id === id ? { ...t, isSynced: true } : t
              ),
            }));
            await db.transactions.update(id, { isSynced: true });
          }
        }

        return newTransaction;
      },

      updateTransaction: async (id, updates) => {
        const transaction = get().transactions.find((t) => t.id === id);
        if (!transaction) return;

        const updatedTransaction = {
          ...transaction,
          ...updates,
          updatedAt: new Date().toISOString(),
          isSynced: false,
        };

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? updatedTransaction : t
          ),
        }));

        await db.transactions.update(id, updatedTransaction);

        if (isSupabaseConfigured() && transaction.userId) {
          const { error } = await supabase
            .from('transactions')
            .update({
              type: updatedTransaction.type,
              category: updatedTransaction.category,
              amount: updatedTransaction.amount,
              description: updatedTransaction.description,
              date: updatedTransaction.date,
              account_id: updatedTransaction.accountId,
            })
            .eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: transaction.userId,
              tableName: 'transactions',
              operation: 'update',
              recordId: id,
              payload: updates as Record<string, unknown>,
            });
          } else {
            set((state) => ({
              transactions: state.transactions.map((t) =>
                t.id === id ? { ...t, isSynced: true } : t
              ),
            }));
            await db.transactions.update(id, { isSynced: true });
          }
        }
      },

      deleteTransaction: async (id) => {
        const transaction = get().transactions.find((t) => t.id === id);
        if (!transaction) return;

        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));

        await db.transactions.delete(id);

        if (isSupabaseConfigured() && transaction.userId) {
          const { error } = await supabase.from('transactions').delete().eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: transaction.userId,
              tableName: 'transactions',
              operation: 'delete',
              recordId: id,
              payload: { id },
            });
          }
        }
      },

      loadTransactions: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          // Try Supabase first
          if (isSupabaseConfigured()) {
            const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: false });

            if (!error && data) {
              const transactions: Transaction[] = data.map((t) => ({
                id: t.id,
                userId: t.user_id,
                type: t.type as TransactionType,
                category: t.category,
                amount: parseFloat(t.amount),
                description: t.description || '',
                date: t.date,
                createdAt: t.created_at,
                accountId: t.account_id,
                mccCode: t.mcc_code,
                bankTransactionId: t.bank_transaction_id,
                isSynced: true,
              }));

              set({ transactions, isLoading: false });

              // Sync to IndexedDB
              await db.transactions.bulkPut(transactions);
              return;
            }
          }

          // Fallback to IndexedDB
          const localTransactions = await db.transactions
            .where('userId')
            .equals(userId)
            .reverse()
            .sortBy('date');

          set({ transactions: localTransactions, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      getTransactionsByAccount: (accountId) =>
        get().transactions.filter((t) => t.accountId === accountId),

      getTransactionsByCategory: (category) =>
        get().transactions.filter((t) => t.category === category),

      getTransactionsByDateRange: (start, end) =>
        get().transactions.filter((t) => {
          const date = new Date(t.date);
          return date >= start && date <= end;
        }),

      getMonthlyTransactions: (year, month) =>
        get().transactions.filter((t) => {
          const date = new Date(t.date);
          return date.getFullYear() === year && date.getMonth() === month;
        }),

      getTotalIncome: () =>
        get()
          .transactions.filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),

      getTotalExpense: () =>
        get()
          .transactions.filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),

      getBalance: () => get().getTotalIncome() - get().getTotalExpense(),

      getMonthlyIncome: () => {
        const now = new Date();
        return get()
          .getMonthlyTransactions(now.getFullYear(), now.getMonth())
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getMonthlyExpense: () => {
        const now = new Date();
        return get()
          .getMonthlyTransactions(now.getFullYear(), now.getMonth())
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getExpensesByCategory: () => {
        const now = new Date();
        return get()
          .getMonthlyTransactions(now.getFullYear(), now.getMonth())
          .filter((t) => t.type === 'expense')
          .reduce(
            (acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
              return acc;
            },
            {} as Record<string, number>
          );
      },
    }),
    {
      name: 'kopimaster-transactions',
      partialize: (state) => ({
        transactions: state.transactions,
      }),
    }
  )
);
