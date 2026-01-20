import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBankConnectionsStore } from '@/stores';
import type { BankProvider } from '@/types/finance';
import { bankingService } from '@/services/banking';

interface ConnectBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectBankModal({ isOpen, onClose }: ConnectBankModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { connectBank, isLoading } = useBankConnectionsStore();

  const [activeTab, setActiveTab] = useState<BankProvider>('monobank');
  const [monobankToken, setMonobankToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableProviders = bankingService.getAvailableProviders();
  const hasMonobank = availableProviders.some((p) => p.provider === 'monobank');
  const hasNordigen = availableProviders.some((p) => p.provider === 'nordigen');
  const hasPlaid = availableProviders.some((p) => p.provider === 'plaid');

  const handleConnectMonobank = async () => {
    if (!user || !monobankToken.trim()) return;

    setError(null);

    try {
      await connectBank(user.id, 'monobank', monobankToken.trim(), 'Monobank');
      setMonobankToken('');
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConnectNordigen = async () => {
    // Nordigen requires OAuth flow - redirect to institution selection
    // This would open a new modal or redirect to Nordigen's bank selection
    setError('Nordigen integration requires environment configuration');
  };

  const handleConnectPlaid = async () => {
    // Plaid requires Link SDK integration
    setError('Plaid integration requires backend configuration');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('banking.connectBank')}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BankProvider)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monobank" disabled={!hasMonobank && false}>
              Monobank
            </TabsTrigger>
            <TabsTrigger value="nordigen" disabled={!hasNordigen}>
              EU Banks
            </TabsTrigger>
            <TabsTrigger value="plaid" disabled={!hasPlaid}>
              Plaid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monobank" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t('banking.monobankInfo')}</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="monobank-token">{t('banking.monobankToken')}</Label>
              <Input
                id="monobank-token"
                type="password"
                value={monobankToken}
                onChange={(e) => setMonobankToken(e.target.value)}
                placeholder={t('banking.tokenPlaceholder')}
              />
              <a
                href="https://api.monobank.ua/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {t('banking.getToken')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleConnectMonobank}
              disabled={isLoading || !monobankToken.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('banking.connect')
              )}
            </Button>
          </TabsContent>

          <TabsContent value="nordigen" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t('banking.nordigenInfo')}</AlertDescription>
            </Alert>

            {!hasNordigen ? (
              <Alert variant="destructive">
                <AlertDescription>{t('banking.nordigenNotConfigured')}</AlertDescription>
              </Alert>
            ) : (
              <Button onClick={handleConnectNordigen} className="w-full">
                {t('banking.selectBank')}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="plaid" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t('banking.plaidInfo')}</AlertDescription>
            </Alert>

            {!hasPlaid ? (
              <Alert variant="destructive">
                <AlertDescription>{t('banking.plaidNotConfigured')}</AlertDescription>
              </Alert>
            ) : (
              <Button onClick={handleConnectPlaid} className="w-full">
                {t('banking.connectWithPlaid')}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
