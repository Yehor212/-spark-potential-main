import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccountsStore } from '@/stores';
import { useCurrency } from '@/hooks/useCurrency';

interface AccountSwitcherProps {
  showBalance?: boolean;
  showAllOption?: boolean;
  className?: string;
}

export function AccountSwitcher({
  showBalance = true,
  showAllOption = true,
  className,
}: AccountSwitcherProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const { accounts, selectedAccountId, setSelectedAccount, getTotalBalance } =
    useAccountsStore();

  if (accounts.length === 0) {
    return null;
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <Select
      value={selectedAccountId || 'all'}
      onValueChange={(value) => setSelectedAccount(value === 'all' ? null : value)}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedAccount ? (
            <span className="flex items-center gap-2">
              <span>{selectedAccount.icon}</span>
              <span>{selectedAccount.name}</span>
              {showBalance && (
                <span className="text-muted-foreground">
                  ({formatAmount(selectedAccount.balance)})
                </span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>🏦</span>
              <span>{t('accounts.allAccounts')}</span>
              {showBalance && (
                <span className="text-muted-foreground">
                  ({formatAmount(getTotalBalance())})
                </span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <span>🏦</span>
              <span>{t('accounts.allAccounts')}</span>
              {showBalance && (
                <span className="text-muted-foreground">
                  ({formatAmount(getTotalBalance())})
                </span>
              )}
            </span>
          </SelectItem>
        )}
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <span className="flex items-center gap-2">
              <span>{account.icon}</span>
              <span>{account.name}</span>
              {showBalance && (
                <span className="text-muted-foreground">
                  ({formatAmount(account.balance)})
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
