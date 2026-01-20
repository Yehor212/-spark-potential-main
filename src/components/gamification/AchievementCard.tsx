import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENT_CATEGORIES } from '@/services/gamification/GamificationService';
import type { Achievement, UserAchievement } from '@/types/finance';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
  className?: string;
  onClick?: () => void;
}

export function AchievementCard({
  achievement,
  userAchievement,
  progress = 0,
  className,
  onClick,
}: AchievementCardProps) {
  const { t } = useTranslation();
  const isUnlocked = !!userAchievement;
  const isSecret = achievement.isSecret && !isUnlocked;
  const category = ACHIEVEMENT_CATEGORIES[achievement.category];

  const progressPercent = Math.min(
    (progress / achievement.requirementValue) * 100,
    100
  );

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isUnlocked
          ? 'bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/30'
          : 'bg-card/50 border-border/50',
        onClick && 'cursor-pointer hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
              isUnlocked
                ? 'bg-amber-500/20'
                : isSecret
                  ? 'bg-muted'
                  : 'bg-muted/50'
            )}
            style={isUnlocked ? { backgroundColor: `${category.color}20` } : undefined}
          >
            {isSecret ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              achievement.icon
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={cn('font-medium', isSecret && 'text-muted-foreground')}>
                  {isSecret ? t('gamification.secretAchievement') : t(achievement.nameKey)}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {isSecret
                    ? t('gamification.secretDescription')
                    : t(achievement.descriptionKey)}
                </p>
              </div>
              {isUnlocked && (
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>

            {/* Progress or XP reward */}
            {!isUnlocked && !isSecret && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {progress} / {achievement.requirementValue}
                  </span>
                  <span className="text-amber-500 font-medium">
                    +{achievement.xpReward} XP
                  </span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}

            {isUnlocked && userAchievement && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-amber-500 font-medium">
                  +{achievement.xpReward} XP
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Unlocked badge */}
      {isUnlocked && (
        <div
          className="absolute top-0 right-0 px-2 py-0.5 text-xs font-medium rounded-bl-lg"
          style={{ backgroundColor: category.color, color: 'white' }}
        >
          {t('gamification.unlocked')}
        </div>
      )}
    </Card>
  );
}
