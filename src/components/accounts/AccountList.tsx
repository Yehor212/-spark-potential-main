import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccountsStore } from '@/stores';
import { useCurrency } from '@/hooks/useCurrency';
import { AccountCard } from './AccountCard';
import { AddAccountModal } from './AddAccountModal';
import { TransferModal } from './TransferModal';
import type { Account } from '@/types/finance';

export function AccountList() {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const {
    accounts,
    selectedAccountId,
    setSelectedAccount,
    deleteAccount,
    setDefaultAccount,
    getTotalBalance,
  } = useAccountsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const totalBalance = getTotalBalance();

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('accounts.confirmDelete'))) {
      await deleteAccount(id);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingAccount(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('accounts.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('accounts.totalBalance')}: {formatAmount(totalBalance)}
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <Button variant="outline" onClick={() => setShowTransferModal(true)}>
              {t('accounts.transfer')}
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('accounts.add')}
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="text-4xl">🏦</div>
          <h3 className="mt-4 text-lg font-medium">{t('accounts.empty')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('accounts.emptyDescription')}
          </p>
          <Button className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('accounts.addFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isSelected={selectedAccountId === account.id}
              onSelect={setSelectedAccount}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={setDefaultAccount}
            />
          ))}
        </div>
      )}

      <AddAccountModal
        open={showAddModal}
        onClose={handleCloseModal}
        editAccount={editingAccount}
      />

      <TransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
      />
    </div>
  );
}
