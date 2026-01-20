import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { syncManager } from '@/services/sync/SyncManager';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(syncManager.getOnlineStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    const unsubOnline = syncManager.on('online', () => {
      setIsOnline(true);
    });

    const unsubOffline = syncManager.on('offline', () => {
      setIsOnline(false);
    });

    const unsubSyncStart = syncManager.on('sync-start', () => {
      setIsSyncing(true);
    });

    const unsubSyncComplete = syncManager.on('sync-complete', (data) => {
      setIsSyncing(false);
      if (data?.syncedCount && data.syncedCount > 0) {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
      updatePendingCount();
    });

    const unsubSyncError = syncManager.on('sync-error', () => {
      setIsSyncing(false);
    });

    // Initial pending count
    updatePendingCount();

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      unsubOnline();
      unsubOffline();
      unsubSyncStart();
      unsubSyncComplete();
      unsubSyncError();
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await syncManager.getPendingCount();
    setPendingCount(count);
  };

  const handleManualSync = () => {
    if (isOnline && !isSyncing) {
      syncManager.sync();
    }
  };

  // Show nothing if online and no pending items
  if (isOnline && pendingCount === 0 && !showSyncSuccess) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
      {/* Sync success notification */}
      {showSyncSuccess && (
        <Badge
          variant="outline"
          className="animate-in fade-in slide-in-from-right-2 border-green-500/50 bg-green-500/10 text-green-500"
        >
          <Cloud className="mr-1 h-3 w-3" />
          {t('pwa.synced')}
        </Badge>
      )}

      {/* Pending sync indicator */}
      {pendingCount > 0 && isOnline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingCount}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing ? t('pwa.syncing') : t('pwa.pendingSync', { count: pendingCount })}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <Badge
          variant="outline"
          className="animate-pulse border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
        >
          <WifiOff className="mr-1 h-3 w-3" />
          {t('pwa.offline')}
          {pendingCount > 0 && (
            <span className="ml-1">({pendingCount})</span>
          )}
        </Badge>
      )}
    </div>
  );
}
