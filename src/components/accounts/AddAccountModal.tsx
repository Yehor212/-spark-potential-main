import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccountsStore } from '@/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { Account, AccountType } from '@/types/finance';

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  editAccount?: Account | null;
}

const ACCOUNT_TYPES: { value: AccountType; labelKey: string; icon: string }[] = [
  { value: 'checking', labelKey: 'accounts.types.checking', icon: '🏦' },
  { value: 'savings', labelKey: 'accounts.types.savings', icon: '🐷' },
  { value: 'credit', labelKey: 'accounts.types.credit', icon: '💳' },
  { value: 'investment', labelKey: 'accounts.types.investment', icon: '📈' },
  { value: 'cash', labelKey: 'accounts.types.cash', icon: '💵' },
];

const CURRENCIES = ['USD', 'EUR', 'UAH', 'GBP', 'JPY', 'CHF'];

export function AddAccountModal({ open, onClose, editAccount }: AddAccountModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addAccount, updateAccount, accounts } = useAccountsStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editAccount) {
      setName(editAccount.name);
      setType(editAccount.type);
      setCurrency(editAccount.currency);
      setBalance(editAccount.balance.toString());
    } else {
      setName('');
      setType('checking');
      setCurrency('USD');
      setBalance('0');
    }
  }, [editAccount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      const accountType = ACCOUNT_TYPES.find((t) => t.value === type);

      if (editAccount) {
        await updateAccount(editAccount.id, {
          name: name.trim(),
          type,
          currency,
          balance: parseFloat(balance) || 0,
          icon: accountType?.icon || '🏦',
        });
      } else {
        await addAccount({
          userId: user?.id || 'local',
          name: name.trim(),
          type,
          currency,
          balance: parseFloat(balance) || 0,
          icon: accountType?.icon || '🏦',
          color: getColorForType(type),
          isDefault: accounts.length === 0,
        });
      }

      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editAccount ? t('accounts.edit') : t('accounts.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('accounts.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('accounts.namePlaceholder')}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('accounts.type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((accountType) => (
                  <SelectItem key={accountType.value} value={accountType.value}>
                    <span className="flex items-center gap-2">
                      <span>{accountType.icon}</span>
                      <span>{t(accountType.labelKey)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('accounts.currency')}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">{t('accounts.initialBalance')}</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? t('common.saving') : editAccount ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getColorForType(type: AccountType): string {
  const colors: Record<AccountType, string> = {
    checking: 'hsl(200 80% 50%)',
    savings: 'hsl(160 84% 39%)',
    credit: 'hsl(0 72% 51%)',
    investment: 'hsl(280 80% 55%)',
    cash: 'hsl(45 90% 50%)',
  };
  return colors[type];
}
