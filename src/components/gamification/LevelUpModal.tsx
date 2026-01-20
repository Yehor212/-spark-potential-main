import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Sparkles, PartyPopper } from 'lucide-react';
import { useGamificationStore } from '@/stores';
import { getLevelTitle } from '@/services/gamification/GamificationService';

export function LevelUpModal() {
  const { t } = useTranslation();
  const { showLevelUpModal, newLevel, dismissLevelUpModal } = useGamificationStore();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showLevelUpModal) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUpModal]);

  if (!newLevel) return null;

  const levelTitle = getLevelTitle(newLevel);

  return (
    <Dialog open={showLevelUpModal} onOpenChange={(open) => !open && dismissLevelUpModal()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">{t('gamification.levelUp')}</DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Celebration icon */}
          <div className="relative mx-auto w-fit">
            <div
              className={`h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg ${
                isAnimating ? 'animate-bounce' : ''
              }`}
            >
              <span className="text-4xl font-bold text-white">{newLevel}</span>
            </div>
            <PartyPopper
              className={`absolute -top-2 -right-2 h-8 w-8 text-amber-500 ${
                isAnimating ? 'animate-spin' : ''
              }`}
            />
            <Sparkles
              className={`absolute -bottom-1 -left-2 h-6 w-6 text-amber-400 ${
                isAnimating ? 'animate-pulse' : ''
              }`}
            />
          </div>

          {/* Level up text */}
          <div>
            <h2 className="text-2xl font-bold text-amber-500 mb-2">
              {t('gamification.levelUp')}!
            </h2>
            <p className="text-muted-foreground">
              {t('gamification.reachedLevel', { level: newLevel })}
            </p>
          </div>

          {/* Level title */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 rounded-lg py-3 px-4">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-lg">{t(levelTitle)}</span>
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground">
            {t('gamification.keepGoing')}
          </p>

          {/* Close button */}
          <Button onClick={dismissLevelUpModal} className="w-full">
            {t('gamification.awesome')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
