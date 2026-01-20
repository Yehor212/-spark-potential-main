import { create } from 'zustand';
import { db, getUnsyncedItems, markAsSynced } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SyncQueueItem } from '@/types/finance';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  error: string | null;

  // Actions
  setOnline: (online: boolean) => void;
  checkPendingItems: () => Promise<void>;
  syncPendingItems: () => Promise<void>;
  forcSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  error: null,

  setOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      get().syncPendingItems();
    }
  },

  checkPendingItems: async () => {
    const items = await getUnsyncedItems();
    set({ pendingCount: items.length });
  },

  syncPendingItems: async () => {
    if (!get().isOnline || get().isSyncing || !isSupabaseConfigured()) return;

    set({ isSyncing: true, error: null });

    try {
      const items = await getUnsyncedItems();

      for (const item of items) {
        await syncItem(item);
        await markAsSynced(item.id);
      }

      set({
        isSyncing: false,
        pendingCount: 0,
        lastSyncAt: new Date().toISOString(),
      });
    } catch (error) {
      set({
        isSyncing: false,
        error: (error as Error).message,
      });
    }
  },

  forcSync: async () => {
    set({ pendingCount: 0 });
    await get().syncPendingItems();
  },
}));

async function syncItem(item: SyncQueueItem): Promise<void> {
  const tableMapping: Record<string, string> = {
    transactions: 'transactions',
    accounts: 'accounts',
    savings_goals: 'savings_goals',
    budgets: 'budgets',
    recurring_transactions: 'recurring_transactions',
    user_achievements: 'user_achievements',
  };

  const table = tableMapping[item.tableName];
  if (!table) return;

  switch (item.operation) {
    case 'insert':
      await supabase.from(table).insert(transformToSnakeCase(item.payload));
      break;
    case 'update':
      await supabase
        .from(table)
        .update(transformToSnakeCase(item.payload))
        .eq('id', item.recordId);
      break;
    case 'delete':
      await supabase.from(table).delete().eq('id', item.recordId);
      break;
  }
}

function transformToSnakeCase(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }

  return result;
}

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}
