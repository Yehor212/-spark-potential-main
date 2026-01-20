import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useBankConnectionsStore } from '@/stores';

export function SyncStatus() {
  const { t } = useTranslation();
  const { lastSyncResult, isSyncing } = useBankConnectionsStore();

  if (isSyncing) {
    return (
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertTriangle className="h-4 w-4 text-blue-500" />
        <AlertTitle>{t('banking.syncing')}</AlertTitle>
        <AlertDescription>{t('banking.syncingDescription')}</AlertDescription>
      </Alert>
    );
  }

  if (!lastSyncResult) return null;

  if (lastSyncResult.success) {
    return (
      <Alert className="bg-green-500/10 border-green-500/20">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>{t('banking.syncSuccess')}</AlertTitle>
        <AlertDescription>
          {t('banking.syncSuccessDescription', {
            accounts: lastSyncResult.accountsSynced,
            transactions: lastSyncResult.newTransactions,
          })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>{t('banking.syncFailed')}</AlertTitle>
      <AlertDescription>
        {lastSyncResult.errors.join(', ')}
      </AlertDescription>
    </Alert>
  );
}
