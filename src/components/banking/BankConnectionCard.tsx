import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, Trash2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { BankConnection } from '@/types/finance';
import { useBankConnectionsStore } from '@/stores';

interface BankConnectionCardProps {
  connection: BankConnection;
}

const PROVIDER_LOGOS: Record<string, string> = {
  monobank: 'https://api.monobank.ua/logo.png',
  nordigen: '🏦',
  plaid: '🔗',
};

const PROVIDER_NAMES: Record<string, string> = {
  monobank: 'Monobank',
  nordigen: 'Nordigen',
  plaid: 'Plaid',
};

export function BankConnectionCard({ connection }: BankConnectionCardProps) {
  const { t } = useTranslation();
  const { syncConnection, disconnectBank, isSyncing } = useBankConnectionsStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSync = async () => {
    await syncConnection(connection.id);
  };

  const handleDisconnect = async () => {
    setIsDeleting(true);
    await disconnectBank(connection.id);
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (connection.status) {
      case 'active':
        return t('banking.status.active');
      case 'expired':
        return t('banking.status.expired');
      case 'error':
        return t('banking.status.error');
      case 'disconnected':
        return t('banking.status.disconnected');
      default:
        return connection.status;
    }
  };

  const formatLastSync = () => {
    if (!connection.lastSyncAt) return t('banking.neverSynced');

    const date = new Date(connection.lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('banking.justNow');
    if (diffMins < 60) return t('banking.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('banking.hoursAgo', { count: diffHours });
    return t('banking.daysAgo', { count: diffDays });
  };

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {connection.provider === 'monobank' ? (
                  <img
                    src={PROVIDER_LOGOS.monobank}
                    alt="Monobank"
                    className="w-8 h-8 rounded"
                  />
                ) : (
                  PROVIDER_LOGOS[connection.provider]
                )}
              </div>
              <div>
                <div className="font-medium">
                  {connection.institutionName || PROVIDER_NAMES[connection.provider]}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                  <span>·</span>
                  <span>{formatLastSync()}</span>
                </div>
                {connection.errorMessage && connection.status === 'error' && (
                  <div className="text-xs text-red-500 mt-1">{connection.errorMessage}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing || connection.status === 'disconnected'}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('banking.disconnectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('banking.disconnectDescription', {
                bank: connection.institutionName || PROVIDER_NAMES[connection.provider],
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? t('common.processing') : t('banking.disconnect')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
