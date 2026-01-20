import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Zap } from 'lucide-react';
import { useGamificationStore } from '@/stores';
import { getLevelTitle } from '@/services/gamification/GamificationService';
import { cn } from '@/lib/utils';

interface UserLevelProps {
  compact?: boolean;
  className?: string;
  showCard?: boolean;
}

export function UserLevel({ compact = false, className, showCard = true }: UserLevelProps) {
  const { t } = useTranslation();
  const { stats, getXPForNextLevel, getXPProgress } = useGamificationStore();

  if (!stats) return null;

  const xpForNextLevel = getXPForNextLevel();
  const xpProgress = getXPProgress();
  const levelTitle = getLevelTitle(stats.level);

  const content = compact ? (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <span className="text-white font-bold">{stats.level}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{t(levelTitle)}</span>
          <span className="text-xs text-muted-foreground">
            {stats.xp}/{xpForNextLevel} XP
          </span>
        </div>
        <Progress value={xpProgress} className="h-1.5" />
      </div>
    </div>
  ) : (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">{stats.level}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{t(levelTitle)}</h3>
          <p className="text-sm text-muted-foreground">
            {t('gamification.level')} {stats.level}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{t('gamification.xpProgress')}</span>
          </div>
          <span className="font-medium">
            {stats.xp} / {xpForNextLevel} XP
          </span>
        </div>
        <Progress value={xpProgress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {Math.ceil(xpForNextLevel - stats.xp)} XP {t('gamification.toNextLevel')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-xl font-bold">{stats.totalTransactions}</div>
          <div className="text-xs text-muted-foreground">{t('gamification.transactions')}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-xl font-bold">${stats.totalSaved.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{t('gamification.totalSaved')}</div>
        </div>
      </div>
    </div>
  );

  if (!showCard) return content;

  return (
    <Card className={cn('bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20', className)}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>{content}</CardContent>
    </Card>
  );
}
