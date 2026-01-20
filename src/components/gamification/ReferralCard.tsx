import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Users, Gift, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateReferralCode } from '@/services/gamification/GamificationService';
import { cn } from '@/lib/utils';

interface ReferralCardProps {
  className?: string;
}

export function ReferralCard({ className }: ReferralCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [referralCount] = useState(0); // TODO: Load from store

  useEffect(() => {
    if (user?.id) {
      // Generate or load referral code
      const code = generateReferralCode(user.id);
      setReferralCode(code);
    }
  }, [user?.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = referralCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'KopiMaster',
      text: t('gamification.shareText', { code: referralCode }),
      url: `${window.location.origin}?ref=${referralCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card className={cn('bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20', className)}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium">{t('gamification.inviteFriends')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('gamification.earnXPPerReferral', { xp: 100 })}
              </p>
            </div>
          </div>
          {referralCount > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-blue-500">{referralCount}</div>
              <div className="text-xs text-muted-foreground">{t('gamification.referred')}</div>
            </div>
          )}
        </div>

        {/* Referral code */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={referralCode}
              readOnly
              className="pr-10 font-mono text-center tracking-wider"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Rewards info */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Gift className="h-4 w-4 text-amber-500" />
          <span>{t('gamification.bothGetReward')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
