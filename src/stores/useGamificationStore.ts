import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Achievement, UserAchievement, UserStats } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface GamificationState {
  stats: UserStats | null;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  isLoading: boolean;
  error: string | null;
  showLevelUpModal: boolean;
  newLevel: number | null;
  newAchievements: UserAchievement[];

  // Actions
  setStats: (stats: UserStats) => void;
  addXP: (amount: number) => Promise<{ leveledUp: boolean; newLevel: number }>;
  updateStreak: () => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<UserAchievement | null>;
  loadGamificationData: (userId: string) => Promise<void>;
  checkAchievements: (context: AchievementContext) => Promise<void>;
  dismissLevelUpModal: () => void;
  clearNewAchievements: () => void;

  // Computed
  getXPForNextLevel: () => number;
  getXPProgress: () => number;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getAchievementProgress: (achievementId: string) => number;
}

interface AchievementContext {
  transactionCount?: number;
  totalSaved?: number;
  goalsCreated?: number;
  goalsCompleted?: number;
  referralCount?: number;
  budgetsKept?: number;
}

const DEFAULT_STATS: Omit<UserStats, 'userId'> = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  totalTransactions: 0,
  totalSaved: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      stats: null,
      achievements: [],
      userAchievements: [],
      isLoading: false,
      error: null,
      showLevelUpModal: false,
      newLevel: null,
      newAchievements: [],

      setStats: (stats) => set({ stats }),

      addXP: async (amount) => {
        const { stats } = get();
        if (!stats) return { leveledUp: false, newLevel: 1 };

        let newXP = stats.xp + amount;
        let newLevel = stats.level;
        let leveledUp = false;

        // Calculate level ups (XP needed = level * 100)
        let xpForNextLevel = newLevel * 100;
        while (newXP >= xpForNextLevel) {
          newXP -= xpForNextLevel;
          newLevel++;
          leveledUp = true;
          xpForNextLevel = newLevel * 100;
        }

        const updatedStats = {
          ...stats,
          xp: newXP,
          level: newLevel,
          updatedAt: new Date().toISOString(),
        };

        set({
          stats: updatedStats,
          showLevelUpModal: leveledUp,
          newLevel: leveledUp ? newLevel : null,
        });

        await db.userStats.put(updatedStats);

        if (isSupabaseConfigured()) {
          await supabase.rpc('add_xp', {
            p_user_id: stats.userId,
            p_amount: amount,
          });
        }

        return { leveledUp, newLevel };
      },

      updateStreak: async () => {
        const { stats } = get();
        if (!stats) return;

        const today = new Date().toISOString().split('T')[0];
        const lastActivity = stats.lastActivityDate;

        let newStreak = stats.currentStreak;

        if (!lastActivity) {
          newStreak = 1;
        } else {
          const lastDate = new Date(lastActivity);
          const todayDate = new Date(today);
          const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 0) {
            // Same day, no change
          } else if (diffDays === 1) {
            // Consecutive day
            newStreak++;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }

        const updatedStats = {
          ...stats,
          currentStreak: newStreak,
          longestStreak: Math.max(stats.longestStreak, newStreak),
          lastActivityDate: today,
          updatedAt: new Date().toISOString(),
        };

        set({ stats: updatedStats });
        await db.userStats.put(updatedStats);

        if (isSupabaseConfigured()) {
          await supabase
            .from('user_stats')
            .update({
              current_streak: newStreak,
              longest_streak: updatedStats.longestStreak,
              last_activity_date: today,
              updated_at: updatedStats.updatedAt,
            })
            .eq('user_id', stats.userId);
        }
      },

      unlockAchievement: async (achievementId) => {
        const { achievements, userAchievements, stats } = get();

        // Check if already unlocked
        if (userAchievements.some((ua) => ua.achievementId === achievementId)) {
          return null;
        }

        const achievement = achievements.find((a) => a.id === achievementId);
        if (!achievement || !stats) return null;

        const id = crypto.randomUUID();
        const newUserAchievement: UserAchievement = {
          id,
          userId: stats.userId,
          achievementId,
          unlockedAt: new Date().toISOString(),
          progress: achievement.requirementValue,
          achievement,
        };

        set((state) => ({
          userAchievements: [...state.userAchievements, newUserAchievement],
          newAchievements: [...state.newAchievements, newUserAchievement],
        }));

        await db.userAchievements.add(newUserAchievement);

        // Award XP for achievement
        if (achievement.xpReward > 0) {
          await get().addXP(achievement.xpReward);
        }

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('user_achievements').insert({
            id,
            user_id: stats.userId,
            achievement_id: achievementId,
            progress: achievement.requirementValue,
          });

          if (error) {
            await addToSyncQueue({
              userId: stats.userId,
              tableName: 'user_achievements',
              operation: 'insert',
              recordId: id,
              payload: newUserAchievement as unknown as Record<string, unknown>,
            });
          }
        }

        return newUserAchievement;
      },

      loadGamificationData: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          // Try to load from local first for instant UI
          const localStats = await db.userStats.get(userId);
          if (localStats) {
            set({ stats: localStats });
          }

          const localAchievements = await db.userAchievements
            .where('userId')
            .equals(userId)
            .toArray();
          if (localAchievements.length > 0) {
            set({ userAchievements: localAchievements });
          }

          // Load from Supabase if configured
          if (isSupabaseConfigured()) {
            // Load achievements definitions (graceful error handling)
            try {
              const { data: achievementsData, error: achievementsError } = await supabase
                .from('achievements')
                .select('*');

              if (!achievementsError && achievementsData) {
                const achievements: Achievement[] = achievementsData.map((a) => ({
                  id: a.id,
                  nameKey: a.name_key,
                  descriptionKey: a.description_key,
                  icon: a.icon,
                  category: a.category,
                  xpReward: a.xp_reward,
                  requirementType: a.requirement_type,
                  requirementValue: a.requirement_value,
                  isSecret: a.is_secret,
                }));
                set({ achievements });
              }
            } catch {
              // Table doesn't exist or other error - use local/default achievements
              console.debug('Achievements table not available');
            }

            // Load user stats (graceful error handling for missing table)
            try {
              const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', userId)
                .single();

              if (!statsError && statsData) {
                const stats: UserStats = {
                  userId: statsData.user_id,
                  xp: statsData.xp,
                  level: statsData.level,
                  currentStreak: statsData.current_streak,
                  longestStreak: statsData.longest_streak,
                  lastActivityDate: statsData.last_activity_date,
                  totalTransactions: statsData.total_transactions,
                  totalSaved: parseFloat(statsData.total_saved || '0'),
                  createdAt: statsData.created_at,
                  updatedAt: statsData.updated_at,
                };
                set({ stats });
                await db.userStats.put(stats);
              } else if (statsError?.code === 'PGRST116' || statsError?.code === '406' || !localStats) {
                // No row found or table doesn't exist - initialize new user stats
                const newStats: UserStats = { ...DEFAULT_STATS, userId };
                set({ stats: newStats });
                await db.userStats.put(newStats);
              }
            } catch {
              // Table doesn't exist - use local stats
              console.debug('User stats table not available');
              if (!localStats) {
                const newStats: UserStats = { ...DEFAULT_STATS, userId };
                set({ stats: newStats });
                await db.userStats.put(newStats);
              }
            }

            // Load user achievements (graceful error handling)
            try {
              const { data: userAchievementsData, error: uaError } = await supabase
                .from('user_achievements')
                .select('*, achievements(*)')
                .eq('user_id', userId);

              if (!uaError && userAchievementsData) {
                const userAchievements: UserAchievement[] = userAchievementsData.map((ua) => ({
                  id: ua.id,
                  userId: ua.user_id,
                  achievementId: ua.achievement_id,
                  unlockedAt: ua.unlocked_at,
                  progress: ua.progress,
                  achievement: ua.achievements
                    ? {
                        id: ua.achievements.id,
                        nameKey: ua.achievements.name_key,
                        descriptionKey: ua.achievements.description_key,
                        icon: ua.achievements.icon,
                        category: ua.achievements.category,
                        xpReward: ua.achievements.xp_reward,
                        requirementType: ua.achievements.requirement_type,
                        requirementValue: ua.achievements.requirement_value,
                        isSecret: ua.achievements.is_secret,
                      }
                    : undefined,
                }));
                set({ userAchievements });
                await db.userAchievements.bulkPut(userAchievements);
              }
            } catch {
              // Table doesn't exist - use local achievements
              console.debug('User achievements table not available');
            }
          } else {
            // No Supabase - ensure local stats exist
            if (!localStats) {
              const newStats: UserStats = { ...DEFAULT_STATS, userId };
              set({ stats: newStats });
              await db.userStats.put(newStats);
            }
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to load gamification data:', error);
          // Still initialize local stats on error
          const newStats: UserStats = { ...DEFAULT_STATS, userId };
          set({ stats: newStats, error: null, isLoading: false });
          await db.userStats.put(newStats);
        }
      },

      checkAchievements: async (context) => {
        const { achievements, userAchievements } = get();
        const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

        for (const achievement of achievements) {
          if (unlockedIds.has(achievement.id)) continue;

          let shouldUnlock = false;

          switch (achievement.requirementType) {
            case 'transactions':
              shouldUnlock = (context.transactionCount || 0) >= achievement.requirementValue;
              break;
            case 'total_saved':
              shouldUnlock = (context.totalSaved || 0) >= achievement.requirementValue;
              break;
            case 'goals_created':
              shouldUnlock = (context.goalsCreated || 0) >= achievement.requirementValue;
              break;
            case 'goals_completed':
              shouldUnlock = (context.goalsCompleted || 0) >= achievement.requirementValue;
              break;
            case 'referrals':
              shouldUnlock = (context.referralCount || 0) >= achievement.requirementValue;
              break;
            case 'budgets_kept':
              shouldUnlock = (context.budgetsKept || 0) >= achievement.requirementValue;
              break;
            case 'streak_days':
              shouldUnlock =
                (get().stats?.currentStreak || 0) >= achievement.requirementValue;
              break;
            case 'level':
              shouldUnlock = (get().stats?.level || 1) >= achievement.requirementValue;
              break;
          }

          if (shouldUnlock) {
            await get().unlockAchievement(achievement.id);
          }
        }
      },

      dismissLevelUpModal: () => set({ showLevelUpModal: false, newLevel: null }),

      clearNewAchievements: () => set({ newAchievements: [] }),

      getXPForNextLevel: () => (get().stats?.level || 1) * 100,

      getXPProgress: () => {
        const { stats } = get();
        if (!stats) return 0;
        const xpNeeded = stats.level * 100;
        return (stats.xp / xpNeeded) * 100;
      },

      getUnlockedAchievements: () => {
        const { achievements, userAchievements } = get();
        const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
        return achievements.filter((a) => unlockedIds.has(a.id));
      },

      getLockedAchievements: () => {
        const { achievements, userAchievements } = get();
        const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
        return achievements.filter((a) => !unlockedIds.has(a.id) && !a.isSecret);
      },

      getAchievementProgress: (achievementId) => {
        const userAchievement = get().userAchievements.find(
          (ua) => ua.achievementId === achievementId
        );
        return userAchievement?.progress || 0;
      },
    }),
    {
      name: 'kopimaster-gamification',
      partialize: (state) => ({
        stats: state.stats,
        userAchievements: state.userAchievements,
      }),
    }
  )
);
