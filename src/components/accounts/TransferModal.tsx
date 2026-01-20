import { useState } from 'react';
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
import { ArrowRight } from 'lucide-react';
import { useAccountsStore } from '@/stores';
import { useCurrency } from '@/hooks/useCurrency';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
}

export function TransferModal({ open, onClose }: TransferModalProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const { accounts, transferBetweenAccounts } = useAccountsStore();

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const isValid =
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    parseFloat(amount) > 0 &&
    fromAccount &&
    parseFloat(amount) <= fromAccount.balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);

    try {
      await transferBetweenAccounts(fromAccountId, toAccountId, parseFloat(amount));
      onClose();
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFromAccountId('');
    setToAccountId('');
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('accounts.transfer')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('accounts.transferFrom')}</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={t('accounts.selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== toAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <span className="flex items-center gap-2">
                        <span>{account.icon}</span>
                        <span>{account.name}</span>
                        <span className="text-muted-foreground">
                          ({formatAmount(account.balance)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>{t('accounts.transferTo')}</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={t('accounts.selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <span className="flex items-center gap-2">
                        <span>{account.icon}</span>
                        <span>{account.name}</span>
                        <span className="text-muted-foreground">
                          ({formatAmount(account.balance)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('common.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={fromAccount?.balance || 0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                {t('accounts.available')}: {formatAmount(fromAccount.balance)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading ? t('common.processing') : t('accounts.transfer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
