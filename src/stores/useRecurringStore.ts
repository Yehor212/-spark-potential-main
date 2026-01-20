import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecurringTransaction, RecurringFrequency } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useTransactionsStore } from './useTransactionsStore';

interface RecurringState {
  recurringTransactions: RecurringTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setRecurringTransactions: (items: RecurringTransaction[]) => void;
  addRecurring: (item: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'nextOccurrence'>) => Promise<RecurringTransaction>;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  loadRecurring: (userId: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;

  // Processing
  processRecurringTransactions: (userId: string) => Promise<number>;
  getUpcomingReminders: (days: number) => RecurringTransaction[];

  // Computed
  getActiveRecurring: () => RecurringTransaction[];
  getRecurringByFrequency: (frequency: RecurringFrequency) => RecurringTransaction[];
  getNextDueDate: () => Date | null;
}

function calculateNextOccurrence(startDate: string, frequency: RecurringFrequency, lastCreatedAt?: string): string {
  const base = lastCreatedAt ? new Date(lastCreatedAt) : new Date(startDate);
  const next = new Date(base);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next.toISOString().split('T')[0];
}

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      recurringTransactions: [],
      isLoading: false,
      error: null,

      setRecurringTransactions: (items) => set({ recurringTransactions: items }),

      addRecurring: async (itemData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const nextOccurrence = calculateNextOccurrence(itemData.startDate, itemData.frequency);

        const newItem: RecurringTransaction = {
          ...itemData,
          id,
          nextOccurrence,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          recurringTransactions: [...state.recurringTransactions, newItem],
        }));

        await db.recurringTransactions.add(newItem);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('recurring_transactions').insert({
            id: newItem.id,
            user_id: itemData.userId,
            account_id: itemData.accountId,
            type: newItem.type,
            category: newItem.category,
            amount: newItem.amount,
            description: newItem.description,
            frequency: newItem.frequency,
            start_date: newItem.startDate,
            end_date: newItem.endDate,
            next_occurrence: newItem.nextOccurrence,
            is_active: newItem.isActive,
            reminder_days: newItem.reminderDays,
          });

          if (error) {
            await addToSyncQueue({
              userId: itemData.userId,
              tableName: 'recurring_transactions',
              operation: 'insert',
              recordId: id,
              payload: newItem as unknown as Record<string, unknown>,
            });
          }
        }

        return newItem;
      },

      updateRecurring: async (id, updates) => {
        const item = get().recurringTransactions.find((r) => r.id === id);
        if (!item) return;

        const updatedItem = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === id ? updatedItem : r
          ),
        }));

        await db.recurringTransactions.update(id, updatedItem);

        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('recurring_transactions')
            .update({
              account_id: updatedItem.accountId,
              type: updatedItem.type,
              category: updatedItem.category,
              amount: updatedItem.amount,
              description: updatedItem.description,
              frequency: updatedItem.frequency,
              start_date: updatedItem.startDate,
              end_date: updatedItem.endDate,
              next_occurrence: updatedItem.nextOccurrence,
              is_active: updatedItem.isActive,
              reminder_days: updatedItem.reminderDays,
              last_created_at: updatedItem.lastCreatedAt,
              updated_at: updatedItem.updatedAt,
            })
            .eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: item.userId,
              tableName: 'recurring_transactions',
              operation: 'update',
              recordId: id,
              payload: updates as Record<string, unknown>,
            });
          }
        }
      },

      deleteRecurring: async (id) => {
        const item = get().recurringTransactions.find((r) => r.id === id);
        if (!item) return;

        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
        }));

        await db.recurringTransactions.delete(id);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: item.userId,
              tableName: 'recurring_transactions',
              operation: 'delete',
              recordId: id,
              payload: { id },
            });
          }
        }
      },

      loadRecurring: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          if (isSupabaseConfigured()) {
            const { data, error } = await supabase
              .from('recurring_transactions')
              .select('*')
              .eq('user_id', userId);

            if (!error && data) {
              const items: RecurringTransaction[] = data.map((r) => ({
                id: r.id,
                userId: r.user_id,
                accountId: r.account_id,
                type: r.type,
                category: r.category,
                amount: parseFloat(r.amount),
                description: r.description || '',
                frequency: r.frequency,
                startDate: r.start_date,
                endDate: r.end_date,
                nextOccurrence: r.next_occurrence,
                lastCreatedAt: r.last_created_at,
                isActive: r.is_active,
                reminderDays: r.reminder_days,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
              }));

              set({ recurringTransactions: items, isLoading: false });
              await db.recurringTransactions.bulkPut(items);
              return;
            }
          }

          const localItems = await db.recurringTransactions
            .where('userId')
            .equals(userId)
            .toArray();
          set({ recurringTransactions: localItems, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      toggleActive: async (id) => {
        const item = get().recurringTransactions.find((r) => r.id === id);
        if (!item) return;

        await get().updateRecurring(id, { isActive: !item.isActive });
      },

      processRecurringTransactions: async (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const activeItems = get().recurringTransactions.filter(
          (r) => r.isActive && r.userId === userId && r.nextOccurrence <= today
        );

        let createdCount = 0;
        const transactionsStore = useTransactionsStore.getState();

        for (const item of activeItems) {
          // Check if end date is passed
          if (item.endDate && item.endDate < today) {
            await get().updateRecurring(item.id, { isActive: false });
            continue;
          }

          // Create the transaction
          await transactionsStore.addTransaction({
            userId: item.userId,
            type: item.type,
            amount: item.amount,
            category: item.category,
            description: item.description,
            date: item.nextOccurrence,
            accountId: item.accountId,
          });

          // Calculate next occurrence
          const nextOccurrence = calculateNextOccurrence(
            item.startDate,
            item.frequency,
            item.nextOccurrence
          );

          await get().updateRecurring(item.id, {
            lastCreatedAt: item.nextOccurrence,
            nextOccurrence,
          });

          createdCount++;
        }

        return createdCount;
      },

      getUpcomingReminders: (days) => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        return get().recurringTransactions.filter((r) => {
          if (!r.isActive) return false;

          // Check if next occurrence is within reminder window
          const reminderDate = new Date(r.nextOccurrence);
          reminderDate.setDate(reminderDate.getDate() - r.reminderDays);
          const reminderDateStr = reminderDate.toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];

          return reminderDateStr <= todayStr && r.nextOccurrence <= futureDateStr;
        });
      },

      getActiveRecurring: () =>
        get().recurringTransactions.filter((r) => r.isActive),

      getRecurringByFrequency: (frequency) =>
        get().recurringTransactions.filter((r) => r.frequency === frequency),

      getNextDueDate: () => {
        const active = get().getActiveRecurring();
        if (active.length === 0) return null;

        const dates = active.map((r) => new Date(r.nextOccurrence));
        return new Date(Math.min(...dates.map((d) => d.getTime())));
      },
    }),
    {
      name: 'kopimaster-recurring',
      partialize: (state) => ({
        recurringTransactions: state.recurringTransactions,
      }),
    }
  )
);
