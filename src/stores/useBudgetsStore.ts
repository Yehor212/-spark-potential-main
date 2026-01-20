import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loadBudgets: (userId: string) => Promise<void>;
  updateSpentAmounts: (expenses: Record<string, number>) => void;

  // Computed
  getBudgetByCategory: (category: string) => Budget | undefined;
  getBudgetsOverThreshold: () => Budget[];
  getBudgetsExceeded: () => Budget[];
  getTotalBudgeted: () => number;
  getTotalSpent: () => number;
}

export const useBudgetsStore = create<BudgetsState>()(
  persist(
    (set, get) => ({
      budgets: [],
      isLoading: false,
      error: null,

      setBudgets: (budgets) => set({ budgets }),

      addBudget: async (budgetData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newBudget: Budget = {
          ...budgetData,
          id,
          spent: 0,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));

        await db.budgets.add(newBudget);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('budgets').insert({
            id: newBudget.id,
            user_id: budgetData.userId,
            category: newBudget.category,
            monthly_limit: newBudget.monthlyLimit,
            alert_threshold: newBudget.alertThreshold,
            is_active: newBudget.isActive,
          });

          if (error) {
            await addToSyncQueue({
              userId: budgetData.userId,
              tableName: 'budgets',
              operation: 'insert',
              recordId: id,
              payload: newBudget as unknown as Record<string, unknown>,
            });
          }
        }

        return newBudget;
      },

      updateBudget: async (id, updates) => {
        const budget = get().budgets.find((b) => b.id === id);
        if (!budget) return;

        const updatedBudget = {
          ...budget,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? updatedBudget : b)),
        }));

        await db.budgets.update(id, updatedBudget);

        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('budgets')
            .update({
              category: updatedBudget.category,
              monthly_limit: updatedBudget.monthlyLimit,
              alert_threshold: updatedBudget.alertThreshold,
              is_active: updatedBudget.isActive,
              updated_at: updatedBudget.updatedAt,
            })
            .eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: budget.userId,
              tableName: 'budgets',
              operation: 'update',
              recordId: id,
              payload: updates as Record<string, unknown>,
            });
          }
        }
      },

      deleteBudget: async (id) => {
        const budget = get().budgets.find((b) => b.id === id);
        if (!budget) return;

        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));

        await db.budgets.delete(id);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('budgets').delete().eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: budget.userId,
              tableName: 'budgets',
              operation: 'delete',
              recordId: id,
              payload: { id },
            });
          }
        }
      },

      loadBudgets: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          if (isSupabaseConfigured()) {
            const { data, error } = await supabase
              .from('budgets')
              .select('*')
              .eq('user_id', userId);

            if (!error && data) {
              const budgets: Budget[] = data.map((b) => ({
                id: b.id,
                userId: b.user_id,
                category: b.category,
                monthlyLimit: parseFloat(b.monthly_limit),
                alertThreshold: parseFloat(b.alert_threshold),
                isActive: b.is_active,
                createdAt: b.created_at,
                updatedAt: b.updated_at,
                spent: 0,
              }));

              set({ budgets, isLoading: false });
              await db.budgets.bulkPut(budgets);
              return;
            }
          }

          const localBudgets = await db.budgets.where('userId').equals(userId).toArray();
          set({ budgets: localBudgets, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateSpentAmounts: (expenses) => {
        set((state) => ({
          budgets: state.budgets.map((b) => ({
            ...b,
            spent: expenses[b.category] || 0,
          })),
        }));
      },

      getBudgetByCategory: (category) => get().budgets.find((b) => b.category === category),

      getBudgetsOverThreshold: () =>
        get().budgets.filter((b) => {
          if (!b.isActive || !b.spent) return false;
          const ratio = b.spent / b.monthlyLimit;
          return ratio >= b.alertThreshold && ratio < 1;
        }),

      getBudgetsExceeded: () =>
        get().budgets.filter((b) => {
          if (!b.isActive || !b.spent) return false;
          return b.spent >= b.monthlyLimit;
        }),

      getTotalBudgeted: () =>
        get()
          .budgets.filter((b) => b.isActive)
          .reduce((sum, b) => sum + b.monthlyLimit, 0),

      getTotalSpent: () =>
        get()
          .budgets.filter((b) => b.isActive)
          .reduce((sum, b) => sum + (b.spent || 0), 0),
    }),
    {
      name: 'kopimaster-budgets',
      partialize: (state) => ({
        budgets: state.budgets,
      }),
    }
  )
);
