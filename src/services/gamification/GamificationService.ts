/**
 * Gamification Service
 * Manages XP rewards, achievements, and user progression
 */

import type { Achievement, AchievementCategory } from '@/types/finance';

// XP rewards for different actions
export const XP_REWARDS = {
  addTransaction: 10,
  addGoal: 25,
  completeGoal: 100,
  addBudget: 20,
  keepBudget: 50, // Monthly budget not exceeded
  dailyLogin: 5,
  connectBank: 50,
  inviteFriend: 100,
  firstTransaction: 25,
  weekStreak: 25,
  monthStreak: 100,
} as const;

// Level thresholds - XP needed for each level
export function getXPForLevel(level: number): number {
  return level * 100;
}

export function getLevelFromTotalXP(totalXP: number): { level: number; currentXP: number } {
  let level = 1;
  let remainingXP = totalXP;

  while (remainingXP >= getXPForLevel(level)) {
    remainingXP -= getXPForLevel(level);
    level++;
  }

  return { level, currentXP: remainingXP };
}

// Default achievements that can be unlocked
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Milestone achievements
  {
    id: 'first_transaction',
    nameKey: 'achievements.first_transaction.name',
    descriptionKey: 'achievements.first_transaction.description',
    icon: '🎉',
    category: 'milestone',
    xpReward: 25,
    requirementType: 'transactions',
    requirementValue: 1,
    isSecret: false,
  },
  {
    id: 'transaction_10',
    nameKey: 'achievements.transaction_10.name',
    descriptionKey: 'achievements.transaction_10.description',
    icon: '📊',
    category: 'milestone',
    xpReward: 50,
    requirementType: 'transactions',
    requirementValue: 10,
    isSecret: false,
  },
  {
    id: 'transaction_100',
    nameKey: 'achievements.transaction_100.name',
    descriptionKey: 'achievements.transaction_100.description',
    icon: '📈',
    category: 'milestone',
    xpReward: 100,
    requirementType: 'transactions',
    requirementValue: 100,
    isSecret: false,
  },
  {
    id: 'transaction_500',
    nameKey: 'achievements.transaction_500.name',
    descriptionKey: 'achievements.transaction_500.description',
    icon: '🏆',
    category: 'milestone',
    xpReward: 250,
    requirementType: 'transactions',
    requirementValue: 500,
    isSecret: false,
  },

  // Savings achievements
  {
    id: 'first_goal',
    nameKey: 'achievements.first_goal.name',
    descriptionKey: 'achievements.first_goal.description',
    icon: '🎯',
    category: 'savings',
    xpReward: 25,
    requirementType: 'goals_created',
    requirementValue: 1,
    isSecret: false,
  },
  {
    id: 'goal_achieved',
    nameKey: 'achievements.goal_achieved.name',
    descriptionKey: 'achievements.goal_achieved.description',
    icon: '✨',
    category: 'savings',
    xpReward: 100,
    requirementType: 'goals_completed',
    requirementValue: 1,
    isSecret: false,
  },
  {
    id: 'saved_1000',
    nameKey: 'achievements.saved_1000.name',
    descriptionKey: 'achievements.saved_1000.description',
    icon: '💰',
    category: 'savings',
    xpReward: 75,
    requirementType: 'total_saved',
    requirementValue: 1000,
    isSecret: false,
  },
  {
    id: 'saved_10000',
    nameKey: 'achievements.saved_10000.name',
    descriptionKey: 'achievements.saved_10000.description',
    icon: '🤑',
    category: 'savings',
    xpReward: 200,
    requirementType: 'total_saved',
    requirementValue: 10000,
    isSecret: false,
  },

  // Spending achievements
  {
    id: 'first_budget',
    nameKey: 'achievements.first_budget.name',
    descriptionKey: 'achievements.first_budget.description',
    icon: '📋',
    category: 'spending',
    xpReward: 25,
    requirementType: 'budgets_created',
    requirementValue: 1,
    isSecret: false,
  },
  {
    id: 'budget_master',
    nameKey: 'achievements.budget_master.name',
    descriptionKey: 'achievements.budget_master.description',
    icon: '🎖️',
    category: 'spending',
    xpReward: 100,
    requirementType: 'budgets_kept',
    requirementValue: 3,
    isSecret: false,
  },

  // Streak achievements
  {
    id: 'streak_7',
    nameKey: 'achievements.streak_7.name',
    descriptionKey: 'achievements.streak_7.description',
    icon: '🔥',
    category: 'streak',
    xpReward: 50,
    requirementType: 'streak_days',
    requirementValue: 7,
    isSecret: false,
  },
  {
    id: 'streak_30',
    nameKey: 'achievements.streak_30.name',
    descriptionKey: 'achievements.streak_30.description',
    icon: '🌟',
    category: 'streak',
    xpReward: 150,
    requirementType: 'streak_days',
    requirementValue: 30,
    isSecret: false,
  },
  {
    id: 'streak_100',
    nameKey: 'achievements.streak_100.name',
    descriptionKey: 'achievements.streak_100.description',
    icon: '💎',
    category: 'streak',
    xpReward: 500,
    requirementType: 'streak_days',
    requirementValue: 100,
    isSecret: false,
  },

  // Social achievements
  {
    id: 'first_referral',
    nameKey: 'achievements.first_referral.name',
    descriptionKey: 'achievements.first_referral.description',
    icon: '👥',
    category: 'social',
    xpReward: 100,
    requirementType: 'referrals',
    requirementValue: 1,
    isSecret: false,
  },
  {
    id: 'referral_5',
    nameKey: 'achievements.referral_5.name',
    descriptionKey: 'achievements.referral_5.description',
    icon: '🌐',
    category: 'social',
    xpReward: 250,
    requirementType: 'referrals',
    requirementValue: 5,
    isSecret: false,
  },

  // Level achievements
  {
    id: 'level_5',
    nameKey: 'achievements.level_5.name',
    descriptionKey: 'achievements.level_5.description',
    icon: '⭐',
    category: 'milestone',
    xpReward: 50,
    requirementType: 'level',
    requirementValue: 5,
    isSecret: false,
  },
  {
    id: 'level_10',
    nameKey: 'achievements.level_10.name',
    descriptionKey: 'achievements.level_10.description',
    icon: '🌟',
    category: 'milestone',
    xpReward: 100,
    requirementType: 'level',
    requirementValue: 10,
    isSecret: false,
  },
  {
    id: 'level_25',
    nameKey: 'achievements.level_25.name',
    descriptionKey: 'achievements.level_25.description',
    icon: '👑',
    category: 'milestone',
    xpReward: 250,
    requirementType: 'level',
    requirementValue: 25,
    isSecret: false,
  },

  // Secret achievements
  {
    id: 'night_owl',
    nameKey: 'achievements.night_owl.name',
    descriptionKey: 'achievements.night_owl.description',
    icon: '🦉',
    category: 'milestone',
    xpReward: 25,
    requirementType: 'special',
    requirementValue: 1,
    isSecret: true,
  },
  {
    id: 'early_bird',
    nameKey: 'achievements.early_bird.name',
    descriptionKey: 'achievements.early_bird.description',
    icon: '🐦',
    category: 'milestone',
    xpReward: 25,
    requirementType: 'special',
    requirementValue: 1,
    isSecret: true,
  },
];

// Category icons and colors
export const ACHIEVEMENT_CATEGORIES: Record<
  AchievementCategory,
  { icon: string; color: string; label: string }
> = {
  savings: { icon: '💰', color: 'hsl(142 71% 45%)', label: 'achievements.categories.savings' },
  spending: { icon: '💳', color: 'hsl(0 72% 51%)', label: 'achievements.categories.spending' },
  streak: { icon: '🔥', color: 'hsl(25 95% 53%)', label: 'achievements.categories.streak' },
  social: { icon: '👥', color: 'hsl(200 80% 50%)', label: 'achievements.categories.social' },
  milestone: { icon: '🏆', color: 'hsl(280 80% 55%)', label: 'achievements.categories.milestone' },
};

// Level titles based on level ranges
export function getLevelTitle(level: number): string {
  if (level < 5) return 'gamification.levels.beginner';
  if (level < 10) return 'gamification.levels.apprentice';
  if (level < 20) return 'gamification.levels.intermediate';
  if (level < 35) return 'gamification.levels.advanced';
  if (level < 50) return 'gamification.levels.expert';
  if (level < 75) return 'gamification.levels.master';
  return 'gamification.levels.legend';
}

// Check for special time-based achievements
export function checkSpecialAchievements(): string[] {
  const unlocked: string[] = [];
  const hour = new Date().getHours();

  // Night owl: activity between midnight and 4am
  if (hour >= 0 && hour < 4) {
    unlocked.push('night_owl');
  }

  // Early bird: activity between 5am and 7am
  if (hour >= 5 && hour < 7) {
    unlocked.push('early_bird');
  }

  return unlocked;
}

// Generate referral code
export function generateReferralCode(userId: string): string {
  const prefix = 'KOPI';
  const hash = userId.slice(0, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${hash}${random}`;
}
