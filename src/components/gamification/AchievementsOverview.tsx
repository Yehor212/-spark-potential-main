import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Lock, Unlock, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGamificationStore, useTransactionsStore, useGoalsStore, useBudgetsStore } from '@/stores';
import { UserLevel } from './UserLevel';
import { StreakIndicator } from './StreakIndicator';
import { AchievementCard } from './AchievementCard';
import { ReferralCard } from './ReferralCard';
import { ACHIEVEMENT_CATEGORIES, DEFAULT_ACHIEVEMENTS } from '@/services/gamification/GamificationService';
import type { AchievementCategory } from '@/types/finance';

export function AchievementsOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    achievements,
    userAchievements,
    loadGamificationData,
    getUnlockedAchievements,
    getLockedAchievements,
    checkAchievements,
  } = useGamificationStore();
  const { transactions } = useTransactionsStore();
  const { goals } = useGoalsStore();
  const { budgets } = useBudgetsStore();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  useEffect(() => {
    if (user?.id) {
      loadGamificationData(user.id);
    }
  }, [user?.id, loadGamificationData]);

  // Check achievements when data changes
  useEffect(() => {
    if (user?.id) {
      checkAchievements({
        transactionCount: transactions.length,
        totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
        goalsCreated: goals.length,
        goalsCompleted: goals.filter((g) => g.currentAmount >= g.targetAmount).length,
        budgetsKept: budgets.filter((b) => b.isActive && (b.spent || 0) <= b.monthlyLimit).length,
      });
    }
  }, [user?.id, transactions.length, goals, budgets, checkAchievements]);

  // Use default achievements if none loaded from server
  const displayAchievements = achievements.length > 0 ? achievements : DEFAULT_ACHIEVEMENTS;

  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = getLockedAchievements();
  const unlockedCount = unlockedAchievements.length;
  const totalCount = displayAchievements.filter((a) => !a.isSecret).length;

  const filteredAchievements = (list: typeof displayAchievements) => {
    if (selectedCategory === 'all') return list;
    return list.filter((a) => a.category === selectedCategory);
  };

  const getProgress = (achievementId: string) => {
    const achievement = displayAchievements.find((a) => a.id === achievementId);
    if (!achievement) return 0;

    switch (achievement.requirementType) {
      case 'transactions':
        return transactions.length;
      case 'goals_created':
        return goals.length;
      case 'goals_completed':
        return goals.filter((g) => g.currentAmount >= g.targetAmount).length;
      case 'total_saved':
        return goals.reduce((sum, g) => sum + g.currentAmount, 0);
      case 'budgets_kept':
        return budgets.filter((b) => b.isActive && (b.spent || 0) <= b.monthlyLimit).length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('gamification.achievements')}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>
            {unlockedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* User Progress */}
      <div className="grid gap-3 sm:grid-cols-2">
        <UserLevel />
        <StreakIndicator />
      </div>

      {/* Referral */}
      <ReferralCard />

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          {t('common.all')}
        </Button>
        {(Object.keys(ACHIEVEMENT_CATEGORIES) as AchievementCategory[]).map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {ACHIEVEMENT_CATEGORIES[category].icon} {t(ACHIEVEMENT_CATEGORIES[category].label)}
          </Button>
        ))}
      </div>

      {/* Achievements Tabs */}
      <Tabs defaultValue="unlocked" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unlocked" className="flex items-center gap-2">
            <Unlock className="h-4 w-4" />
            {t('gamification.unlocked')} ({unlockedCount})
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t('gamification.locked')} ({totalCount - unlockedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked" className="space-y-3 mt-4">
          {filteredAchievements(unlockedAchievements).length === 0 ? (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Award className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">{t('gamification.noUnlocked')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredAchievements(unlockedAchievements).map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                userAchievement={userAchievements.find(
                  (ua) => ua.achievementId === achievement.id
                )}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="locked" className="space-y-3 mt-4">
          {filteredAchievements(lockedAchievements).length === 0 ? (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-12 w-12 text-amber-500/50 mb-3" />
                <p className="text-muted-foreground">{t('gamification.allUnlocked')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredAchievements(lockedAchievements).map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={getProgress(achievement.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
