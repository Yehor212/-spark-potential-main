import { db, getUnsyncedItems, markAsSynced } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SyncQueueItem } from '@/types/finance';

type SyncEventType = 'sync-start' | 'sync-complete' | 'sync-error' | 'online' | 'offline';
type SyncEventCallback = (data?: { error?: string; syncedCount?: number }) => void;

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<SyncEventType, Set<SyncEventCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Start periodic sync check
      this.startPeriodicSync();
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.emit('online');
    // Attempt to sync when coming back online
    this.sync();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.emit('offline');
  };

  on(event: SyncEventType, callback: SyncEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: SyncEventType, data?: { error?: string; syncedCount?: number }) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  getSyncingStatus(): boolean {
    return this.isSyncing;
  }

  private startPeriodicSync() {
    // Check for unsynced items every 30 seconds
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 30000);
  }

  async sync(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (!this.isOnline || this.isSyncing || !isSupabaseConfigured()) {
      return { success: false, syncedCount: 0 };
    }

    this.isSyncing = true;
    this.emit('sync-start');

    try {
      const unsyncedItems = await getUnsyncedItems();
      let syncedCount = 0;

      for (const item of unsyncedItems) {
        try {
          await this.syncItem(item);
          await markAsSynced(item.id);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // Continue with other items even if one fails
        }
      }

      this.isSyncing = false;
      this.emit('sync-complete', { syncedCount });
      return { success: true, syncedCount };
    } catch (error) {
      this.isSyncing = false;
      const errorMessage = (error as Error).message;
      this.emit('sync-error', { error: errorMessage });
      return { success: false, syncedCount: 0, error: errorMessage };
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    const tableMapping: Record<string, string> = {
      transactions: 'transactions',
      accounts: 'accounts',
      savings_goals: 'savings_goals',
      budgets: 'budgets',
      recurring_transactions: 'recurring_transactions',
      user_achievements: 'user_achievements',
      user_stats: 'user_stats',
    };

    const table = tableMapping[item.tableName];
    if (!table) {
      console.warn(`Unknown table: ${item.tableName}`);
      return;
    }

    const payload = this.transformToSnakeCase(item.payload);

    switch (item.operation) {
      case 'insert':
        const { error: insertError } = await supabase.from(table).insert(payload);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(table)
          .update(payload)
          .eq('id', item.recordId);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', item.recordId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private transformToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = value;
    }

    return result;
  }

  async getPendingCount(): Promise<number> {
    const items = await getUnsyncedItems();
    return items.length;
  }

  async clearSyncQueue(): Promise<void> {
    await db.syncQueue.clear();
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.listeners.clear();
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// React hook for sync status
export function useSyncManager() {
  return syncManager;
}
