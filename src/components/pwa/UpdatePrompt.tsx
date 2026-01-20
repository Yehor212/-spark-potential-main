import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function UpdatePrompt() {
  const { t } = useTranslation();
  const { needRefresh, offlineReady, acceptUpdate, dismissUpdate, dismissOfflineReady } = usePWA();

  if (offlineReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 md:left-auto md:right-4 md:max-w-sm">
        <Card className="border-green-500/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <span className="text-xl">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t('pwa.offlineReady')}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={dismissOfflineReady}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 md:left-auto md:right-4 md:max-w-sm">
        <Card className="border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t('pwa.updateTitle')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('pwa.updateDescription')}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={acceptUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('pwa.update')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={dismissUpdate}>
                    {t('pwa.later')}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={dismissUpdate}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
