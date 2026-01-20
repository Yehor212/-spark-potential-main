import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { useGamificationStore } from '@/stores';
import { cn } from '@/lib/utils';

interface StreakIndicatorProps {
  compact?: boolean;
  className?: string;
  showCard?: boolean;
}

export function StreakIndicator({ compact = false, className, showCard = true }: StreakIndicatorProps) {
  const { t } = useTranslation();
  const { stats } = useGamificationStore();

  if (!stats) return null;

  const streakColor =
    stats.currentStreak >= 30
      ? 'text-purple-500'
      : stats.currentStreak >= 7
        ? 'text-orange-500'
        : 'text-amber-500';

  const streakBgColor =
    stats.currentStreak >= 30
      ? 'from-purple-500/10 to-purple-500/5 border-purple-500/20'
      : stats.currentStreak >= 7
        ? 'from-orange-500/10 to-orange-500/5 border-orange-500/20'
        : 'from-amber-500/10 to-amber-500/5 border-amber-500/20';

  const content = compact ? (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Flame className={cn('h-5 w-5', streakColor)} />
        {stats.currentStreak >= 7 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </div>
      <div>
        <span className={cn('font-bold', streakColor)}>{stats.currentStreak}</span>
        <span className="text-xs text-muted-foreground ml-1">{t('gamification.days')}</span>
      </div>
    </div>
  ) : (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('h-12 w-12 rounded-full flex items-center justify-center',
            stats.currentStreak >= 30 ? 'bg-purple-500/20' :
            stats.currentStreak >= 7 ? 'bg-orange-500/20' : 'bg-amber-500/20'
          )}>
            <Flame className={cn('h-6 w-6', streakColor)} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-3xl font-bold', streakColor)}>
                {stats.currentStreak}
              </span>
              <span className="text-muted-foreground">{t('gamification.dayStreak')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.currentStreak === 0
                ? t('gamification.startStreak')
                : stats.currentStreak >= 7
                  ? t('gamification.keepItUp')
                  : t('gamification.buildingStreak')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Trophy className="h-4 w-4 text-amber-500" />
          <div>
            <div className="font-bold">{stats.longestStreak}</div>
            <div className="text-xs text-muted-foreground">{t('gamification.longestStreak')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Calendar className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-bold">
              {stats.lastActivityDate
                ? new Date(stats.lastActivityDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : '-'}
            </div>
            <div className="text-xs text-muted-foreground">{t('gamification.lastActive')}</div>
          </div>
        </div>
      </div>

      {/* Streak milestones */}
      <div className="flex justify-between text-xs">
        {[7, 14, 30, 60, 100].map((milestone) => (
          <div
            key={milestone}
            className={cn(
              'flex flex-col items-center gap-1',
              stats.currentStreak >= milestone ? 'text-amber-500' : 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                stats.currentStreak >= milestone ? 'bg-amber-500' : 'bg-muted'
              )}
            />
            <span>{milestone}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!showCard) return content;

  return (
    <Card className={cn('bg-gradient-to-br', streakBgColor, className)}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>{content}</CardContent>
    </Card>
  );
}
