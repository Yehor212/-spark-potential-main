import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, AccountType } from '@/types/finance';
import { db, addToSyncQueue } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AccountsState {
  accounts: Account[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setSelectedAccount: (id: string | null) => void;
  setDefaultAccount: (id: string) => Promise<void>;
  loadAccounts: (userId: string) => Promise<void>;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number) => Promise<void>;

  // Computed
  getDefaultAccount: () => Account | undefined;
  getAccountById: (id: string) => Account | undefined;
  getTotalBalance: () => number;
  getAccountsByType: (type: AccountType) => Account[];
}

const ACCOUNT_ICONS: Record<AccountType, string> = {
  checking: '🏦',
  savings: '🐷',
  credit: '💳',
  investment: '📈',
  cash: '💵',
};

const ACCOUNT_COLORS: Record<AccountType, string> = {
  checking: 'hsl(200 80% 50%)',
  savings: 'hsl(160 84% 39%)',
  credit: 'hsl(0 72% 51%)',
  investment: 'hsl(280 80% 55%)',
  cash: 'hsl(45 90% 50%)',
};

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      isLoading: false,
      error: null,

      setAccounts: (accounts) => set({ accounts }),

      addAccount: async (accountData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newAccount: Account = {
          ...accountData,
          id,
          icon: accountData.icon || ACCOUNT_ICONS[accountData.type],
          color: accountData.color || ACCOUNT_COLORS[accountData.type],
          createdAt: now,
          updatedAt: now,
        };

        // Add to local state
        set((state) => ({
          accounts: [...state.accounts, newAccount],
        }));

        // Add to IndexedDB
        await db.accounts.add(newAccount);

        // Sync to Supabase if configured
        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('accounts').insert({
            id: newAccount.id,
            user_id: newAccount.userId,
            name: newAccount.name,
            type: newAccount.type,
            currency: newAccount.currency,
            balance: newAccount.balance,
            icon: newAccount.icon,
            color: newAccount.color,
            is_default: newAccount.isDefault,
          });

          if (error) {
            // Add to sync queue for later
            await addToSyncQueue({
              userId: newAccount.userId,
              tableName: 'accounts',
              operation: 'insert',
              recordId: id,
              payload: newAccount as unknown as Record<string, unknown>,
            });
          }
        }

        return newAccount;
      },

      updateAccount: async (id, updates) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account) return;

        const updatedAccount = {
          ...account,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? updatedAccount : a)),
        }));

        await db.accounts.update(id, updatedAccount);

        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('accounts')
            .update({
              name: updatedAccount.name,
              type: updatedAccount.type,
              currency: updatedAccount.currency,
              balance: updatedAccount.balance,
              icon: updatedAccount.icon,
              color: updatedAccount.color,
              is_default: updatedAccount.isDefault,
              updated_at: updatedAccount.updatedAt,
            })
            .eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: account.userId,
              tableName: 'accounts',
              operation: 'update',
              recordId: id,
              payload: updates as Record<string, unknown>,
            });
          }
        }
      },

      deleteAccount: async (id) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account) return;

        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          selectedAccountId:
            state.selectedAccountId === id ? null : state.selectedAccountId,
        }));

        await db.accounts.delete(id);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('accounts').delete().eq('id', id);

          if (error) {
            await addToSyncQueue({
              userId: account.userId,
              tableName: 'accounts',
              operation: 'delete',
              recordId: id,
              payload: { id },
            });
          }
        }
      },

      setSelectedAccount: (id) => set({ selectedAccountId: id }),

      setDefaultAccount: async (id) => {
        const accounts = get().accounts;
        const userId = accounts.find((a) => a.id === id)?.userId;
        if (!userId) return;

        // Update all accounts for this user
        const updatedAccounts = accounts.map((a) => ({
          ...a,
          isDefault: a.userId === userId ? a.id === id : a.isDefault,
        }));

        set({ accounts: updatedAccounts });

        // Update in IndexedDB
        for (const account of updatedAccounts.filter((a) => a.userId === userId)) {
          await db.accounts.update(account.id, { isDefault: account.isDefault });
        }

        // Update in Supabase
        if (isSupabaseConfigured()) {
          await supabase
            .from('accounts')
            .update({ is_default: false })
            .eq('user_id', userId);

          await supabase.from('accounts').update({ is_default: true }).eq('id', id);
        }
      },

      loadAccounts: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          // Try to load from Supabase first
          if (isSupabaseConfigured()) {
            const { data, error } = await supabase
              .from('accounts')
              .select('*')
              .eq('user_id', userId);

            if (!error && data) {
              const accounts: Account[] = data.map((a) => ({
                id: a.id,
                userId: a.user_id,
                name: a.name,
                type: a.type,
                currency: a.currency,
                balance: parseFloat(a.balance),
                icon: a.icon,
                color: a.color,
                isDefault: a.is_default,
                bankConnectionId: a.bank_connection_id,
                externalAccountId: a.external_account_id,
                createdAt: a.created_at,
                updatedAt: a.updated_at,
              }));

              set({ accounts, isLoading: false });

              // Sync to IndexedDB
              await db.accounts.bulkPut(accounts);
              return;
            }
          }

          // Fallback to IndexedDB
          const localAccounts = await db.accounts.where('userId').equals(userId).toArray();
          set({ accounts: localAccounts, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      transferBetweenAccounts: async (fromId, toId, amount) => {
        const fromAccount = get().accounts.find((a) => a.id === fromId);
        const toAccount = get().accounts.find((a) => a.id === toId);

        if (!fromAccount || !toAccount) return;
        if (fromAccount.balance < amount) return;

        await get().updateAccount(fromId, {
          balance: fromAccount.balance - amount,
        });

        await get().updateAccount(toId, {
          balance: toAccount.balance + amount,
        });
      },

      getDefaultAccount: () => get().accounts.find((a) => a.isDefault),

      getAccountById: (id) => get().accounts.find((a) => a.id === id),

      getTotalBalance: () =>
        get().accounts.reduce((sum, a) => {
          // Credit accounts have negative balance impact
          const multiplier = a.type === 'credit' ? -1 : 1;
          return sum + a.balance * multiplier;
        }, 0),

      getAccountsByType: (type) => get().accounts.filter((a) => a.type === type),
    }),
    {
      name: 'kopimaster-accounts',
      partialize: (state) => ({
        accounts: state.accounts,
        selectedAccountId: state.selectedAccountId,
      }),
    }
  )
);
