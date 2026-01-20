import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavingsGoal } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface GoalsState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setGoals: (goals: SavingsGoal[]) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<SavingsGoal>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addToGoal: (id: string, amount: number) => Promise<void>;
  loadGoals: (userId: string) => Promise<void>;

  // Computed
  getActiveGoals: () => SavingsGoal[];
  getCompletedGoals: () => SavingsGoal[];
  getTotalSaved: () => number;
  getTotalTarget: () => number;
  getOverallProgress: () => number;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: false,
      error: null,

      setGoals: (goals) => set({ goals }),

      addGoal: async (goalData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newGoal: SavingsGoal = {
          ...goalData,
          id,
          createdAt: now,
        };

        set((state) => ({
          goals: [...state.goals, newGoal],
        }));

        await db.savingsGoals.add(newGoal);

        if (isSupabaseConfigured() && goalData.userId) {
          const { error } = await supabase.from('savings_goals').insert({
            id: newGoal.id,
            user_id: goalData.userId,
            name: newGoal.name,
            target_amount: newGoal.targetAmount,
            current_amount: newGoal.currentAmount,
            icon: newGoal.icon,
            color: newGoal.color,
          });

          if (error) {
            await addToSyncQueue({
              userId: goalData.userId,
              tableName: 'savings_goals',
              operation: 'insert',
              recordId: id,
              payload: newGoal as unknown as Record<string, unknown>,
            });
          }
        }

        return newGoal;
      },

      updateGoal: async (id, updates) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;

        const updatedGoal = { ...goal, ...updates };

        // Check if goal is completed
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount && !updatedGoal.completedAt) {
          updatedGoal.completedAt = new Date().toISOString();
        }

        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
        }));

        await db.savingsGoals.update(id, updatedGoal);

        if (isSupabaseConfigured() && goal.userId) {
          const { error } = await supabase
            .from('savings_goals')
            .update({
              name: updatedGoal.name,
              target_amount: updatedGoal.targetAmount,
              current_amount: updatedGoal.currentAmount,
              icon: updatedGoal.icon,
              color: updatedGoal.color,
              completed_at: updatedGoal.completedAt,
            })
            .eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: goal.userId,
              tableName: 'savings_goals',
              operation: 'update',
              recordId: id,
              payload: updates as Record<string, unknown>,
            });
          }
        }
      },

      deleteGoal: async (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;

        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));

        await db.savingsGoals.delete(id);

        if (isSupabaseConfigured() && goal.userId) {
          const { error } = await supabase.from('savings_goals').delete().eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: goal.userId,
              tableName: 'savings_goals',
              operation: 'delete',
              recordId: id,
              payload: { id },
            });
          }
        }
      },

      addToGoal: async (id, amount) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;

        const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
        await get().updateGoal(id, { currentAmount: newAmount });
      },

      loadGoals: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          if (isSupabaseConfigured()) {
            const { data, error } = await supabase
              .from('savings_goals')
              .select('*')
              .eq('user_id', userId);

            if (!error && data) {
              const goals: SavingsGoal[] = data.map((g) => ({
                id: g.id,
                userId: g.user_id,
                name: g.name,
                targetAmount: parseFloat(g.target_amount),
                currentAmount: parseFloat(g.current_amount),
                icon: g.icon,
                color: g.color,
                createdAt: g.created_at,
                completedAt: g.completed_at,
              }));

              set({ goals, isLoading: false });
              await db.savingsGoals.bulkPut(goals);
              return;
            }
          }

          const localGoals = await db.savingsGoals.where('userId').equals(userId).toArray();
          set({ goals: localGoals, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      getActiveGoals: () => get().goals.filter((g) => !g.completedAt),

      getCompletedGoals: () => get().goals.filter((g) => g.completedAt),

      getTotalSaved: () => get().goals.reduce((sum, g) => sum + g.currentAmount, 0),

      getTotalTarget: () => get().goals.reduce((sum, g) => sum + g.targetAmount, 0),

      getOverallProgress: () => {
        const total = get().getTotalTarget();
        if (total === 0) return 0;
        return (get().getTotalSaved() / total) * 100;
      },
    }),
    {
      name: 'kopimaster-goals',
      partialize: (state) => ({
        goals: state.goals,
      }),
    }
  )
);
