import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, Building2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBankConnectionsStore } from '@/stores';
import { BankConnectionCard } from './BankConnectionCard';
import { ConnectBankModal } from './ConnectBankModal';

export function BankConnectionsList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { connections, loadConnections, syncAllConnections, isLoading, isSyncing } =
    useBankConnectionsStore();
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadConnections(user.id);
    }
  }, [user?.id, loadConnections]);

  const handleSyncAll = async () => {
    if (user?.id) {
      await syncAllConnections(user.id);
    }
  };

  const activeConnections = connections.filter((c) => c.status !== 'disconnected');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('banking.title')}</h3>
        <div className="flex items-center gap-2">
          {activeConnections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {t('banking.syncAll')}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowConnectModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('banking.addConnection')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-8 bg-card/50 rounded-lg border border-dashed border-border/50">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h4 className="font-medium text-muted-foreground">{t('banking.empty')}</h4>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            {t('banking.emptyDescription')}
          </p>
          <Button onClick={() => setShowConnectModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('banking.connectFirst')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => (
            <BankConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}

      <ConnectBankModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
}
