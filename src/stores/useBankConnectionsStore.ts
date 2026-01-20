import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BankConnection, BankProvider, ConnectionStatus } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { bankingService, type BankTransaction, type SyncResult } from '@/services/banking';
import { useTransactionsStore } from './useTransactionsStore';
import { useAccountsStore } from './useAccountsStore';

interface BankConnectionsState {
  connections: BankConnection[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncResult: SyncResult | null;

  // Actions
  setConnections: (connections: BankConnection[]) => void;
  addConnection: (connection: Omit<BankConnection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<BankConnection>;
  updateConnection: (id: string, updates: Partial<BankConnection>) => Promise<void>;
  removeConnection: (id: string) => Promise<void>;
  loadConnections: (userId: string) => Promise<void>;

  // Banking operations
  connectBank: (
    userId: string,
    provider: BankProvider,
    accessToken: string,
    institutionName?: string
  ) => Promise<BankConnection>;
  disconnectBank: (id: string) => Promise<void>;
  syncConnection: (id: string) => Promise<SyncResult>;
  syncAllConnections: (userId: string) => Promise<SyncResult[]>;
  validateConnection: (id: string) => Promise<boolean>;

  // Computed
  getConnectionsByProvider: (provider: BankProvider) => BankConnection[];
  getActiveConnections: () => BankConnection[];
  hasActiveConnection: (provider: BankProvider) => boolean;
}

export const useBankConnectionsStore = create<BankConnectionsState>()(
  persist(
    (set, get) => ({
      connections: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      lastSyncResult: null,

      setConnections: (connections) => set({ connections }),

      addConnection: async (connectionData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newConnection: BankConnection = {
          ...connectionData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          connections: [...state.connections, newConnection],
        }));

        // Add to IndexedDB
        await db.bankConnections.add(newConnection);

        // Sync to Supabase
        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('bank_connections').insert({
            id: newConnection.id,
            user_id: newConnection.userId,
            provider: newConnection.provider,
            access_token: newConnection.accessToken,
            refresh_token: newConnection.refreshToken,
            institution_id: newConnection.institutionId,
            institution_name: newConnection.institutionName,
            status: newConnection.status,
          });

          if (error) {
            await addToSyncQueue({
              userId: newConnection.userId,
              tableName: 'bank_connections',
              operation: 'insert',
              recordId: id,
              payload: newConnection as unknown as Record<string, unknown>,
            });
          }
        }

        return newConnection;
      },

      updateConnection: async (id, updates) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection) return;

        const updatedConnection = {
          ...connection,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? updatedConnection : c
          ),
        }));

        await db.bankConnections.update(id, updatedConnection);

        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('bank_connections')
            .update({
              access_token: updatedConnection.accessToken,
              refresh_token: updatedConnection.refreshToken,
              status: updatedConnection.status,
              last_sync_at: updatedConnection.lastSyncAt,
              error_message: updatedConnection.errorMessage,
              updated_at: updatedConnection.updatedAt,
            })
            .eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: connection.userId,
              tableName: 'bank_connections',
              operation: 'update',
              recordId: id,
              payload: updates as Record<string, unknown>,
            });
          }
        }
      },

      removeConnection: async (id) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection) return;

        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        }));

        await db.bankConnections.delete(id);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('bank_connections').delete().eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: connection.userId,
              tableName: 'bank_connections',
              operation: 'delete',
              recordId: id,
              payload: { id },
            });
          }
        }
      },

      loadConnections: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          if (isSupabaseConfigured()) {
            const { data, error } = await supabase
              .from('bank_connections')
              .select('*')
              .eq('user_id', userId);

            if (!error && data) {
              const connections: BankConnection[] = data.map((c) => ({
                id: c.id,
                userId: c.user_id,
                provider: c.provider,
                accessToken: c.access_token,
                refreshToken: c.refresh_token,
                institutionId: c.institution_id,
                institutionName: c.institution_name,
                status: c.status,
                lastSyncAt: c.last_sync_at,
                errorMessage: c.error_message,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
              }));

              set({ connections, isLoading: false });
              await db.bankConnections.bulkPut(connections);
              return;
            }
          }

          // Fallback to IndexedDB
          const localConnections = await db.bankConnections
            .where('userId')
            .equals(userId)
            .toArray();
          set({ connections: localConnections, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      connectBank: async (userId, provider, accessToken, institutionName) => {
        set({ isLoading: true, error: null });

        try {
          // Connect via banking service
          const config = await bankingService.connect(provider, {
            provider,
            accessToken,
            institutionName,
          });

          // Create connection record
          const connection = await get().addConnection({
            userId,
            provider,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
            institutionId: config.institutionId,
            institutionName: config.institutionName || institutionName,
            status: 'active',
          });

          // Import accounts from bank
          const bankAccounts = await bankingService.getAccounts(provider, config);
          const accountsStore = useAccountsStore.getState();

          for (const bankAccount of bankAccounts) {
            await accountsStore.addAccount({
              userId,
              name: bankAccount.name,
              type: bankAccount.type === 'investment' ? 'investment' : bankAccount.type,
              currency: bankAccount.currency,
              balance: bankAccount.balance,
              icon: '',
              color: '',
              isDefault: false,
              bankConnectionId: connection.id,
              externalAccountId: bankAccount.id,
            });
          }

          set({ isLoading: false });
          return connection;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      disconnectBank: async (id) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection) return;

        try {
          // Disconnect via banking service
          await bankingService.disconnect(connection.provider, {
            provider: connection.provider,
            accessToken: connection.accessToken,
            refreshToken: connection.refreshToken,
          });
        } catch {
          // Continue with removal even if disconnect fails
        }

        // Remove linked accounts
        const accountsStore = useAccountsStore.getState();
        const linkedAccounts = accountsStore.accounts.filter(
          (a) => a.bankConnectionId === id
        );
        for (const account of linkedAccounts) {
          await accountsStore.deleteAccount(account.id);
        }

        // Remove connection
        await get().removeConnection(id);
      },

      syncConnection: async (id) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection) {
          return {
            success: false,
            accountsSynced: 0,
            transactionsSynced: 0,
            newTransactions: 0,
            errors: ['Connection not found'],
            lastSyncAt: new Date().toISOString(),
          };
        }

        set({ isSyncing: true, error: null });

        try {
          // Get existing transaction IDs to avoid duplicates
          const transactionsStore = useTransactionsStore.getState();
          const existingIds = new Set(
            transactionsStore.transactions
              .filter((t) => t.bankTransactionId)
              .map((t) => t.bankTransactionId!)
          );

          // Sync via banking service
          const result = await bankingService.syncConnection(
            connection.provider,
            {
              provider: connection.provider,
              accessToken: connection.accessToken,
              refreshToken: connection.refreshToken,
            },
            existingIds,
            async (bankTx: BankTransaction) => {
              // Find linked account
              const accountsStore = useAccountsStore.getState();
              const account = accountsStore.accounts.find(
                (a) =>
                  a.bankConnectionId === id && a.externalAccountId === bankTx.accountId
              );

              if (account) {
                await transactionsStore.addTransaction({
                  userId: connection.userId,
                  type: bankTx.type,
                  amount: bankTx.amount,
                  category: bankTx.category || 'other',
                  description: bankTx.description,
                  date: bankTx.date,
                  accountId: account.id,
                  mccCode: bankTx.mccCode,
                  bankTransactionId: bankTx.id,
                });
              }
            }
          );

          // Update connection status
          const status: ConnectionStatus = result.success ? 'active' : 'error';
          await get().updateConnection(id, {
            status,
            lastSyncAt: result.lastSyncAt,
            errorMessage: result.errors.length > 0 ? result.errors.join('; ') : undefined,
          });

          set({ isSyncing: false, lastSyncResult: result });
          return result;
        } catch (error) {
          const errorResult: SyncResult = {
            success: false,
            accountsSynced: 0,
            transactionsSynced: 0,
            newTransactions: 0,
            errors: [(error as Error).message],
            lastSyncAt: new Date().toISOString(),
          };

          await get().updateConnection(id, {
            status: 'error',
            errorMessage: (error as Error).message,
          });

          set({ isSyncing: false, error: (error as Error).message, lastSyncResult: errorResult });
          return errorResult;
        }
      },

      syncAllConnections: async (userId) => {
        const activeConnections = get()
          .connections.filter((c) => c.userId === userId && c.status === 'active');

        const results: SyncResult[] = [];

        for (const connection of activeConnections) {
          const result = await get().syncConnection(connection.id);
          results.push(result);
        }

        return results;
      },

      validateConnection: async (id) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection) return false;

        const isValid = await bankingService.validateConnection(connection.provider, {
          provider: connection.provider,
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
        });

        if (!isValid) {
          await get().updateConnection(id, { status: 'expired' });
        }

        return isValid;
      },

      getConnectionsByProvider: (provider) =>
        get().connections.filter((c) => c.provider === provider),

      getActiveConnections: () =>
        get().connections.filter((c) => c.status === 'active'),

      hasActiveConnection: (provider) =>
        get().connections.some((c) => c.provider === provider && c.status === 'active'),
    }),
    {
      name: 'kopimaster-bank-connections',
      partialize: (state) => ({
        connections: state.connections.map((c) => ({
          ...c,
          // Don't persist sensitive tokens in localStorage
          accessToken: undefined,
          refreshToken: undefined,
        })),
      }),
    }
  )
);
