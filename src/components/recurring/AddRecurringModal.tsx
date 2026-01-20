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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecurringStore, useAccountsStore } from '@/stores';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type RecurringTransaction,
  type TransactionType,
  type RecurringFrequency,
} from '@/types/finance';

interface AddRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: RecurringTransaction | null;
}

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export function AddRecurringModal({ isOpen, onClose, editItem }: AddRecurringModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addRecurring, updateRecurring } = useRecurringStore();
  const { accounts } = useAccountsStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [reminderDays, setReminderDays] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setAmount(editItem.amount.toString());
      setCategory(editItem.category);
      setDescription(editItem.description || '');
      setFrequency(editItem.frequency);
      setStartDate(editItem.startDate);
      setEndDate(editItem.endDate || '');
      setAccountId(editItem.accountId || '');
      setReminderDays(editItem.reminderDays.toString());
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setAccountId(accounts.find((a) => a.isDefault)?.id || '');
      setReminderDays('1');
    }
  }, [editItem, isOpen, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !category || !startDate) return;

    setIsSubmitting(true);

    try {
      if (editItem) {
        await updateRecurring(editItem.id, {
          type,
          amount: parseFloat(amount),
          category,
          description,
          frequency,
          startDate,
          endDate: endDate || undefined,
          accountId: accountId || undefined,
          reminderDays: parseInt(reminderDays, 10),
        });
      } else {
        await addRecurring({
          userId: user.id,
          type,
          amount: parseFloat(amount),
          category,
          description,
          frequency,
          startDate,
          endDate: endDate || undefined,
          accountId: accountId || undefined,
          isActive: true,
          reminderDays: parseInt(reminderDays, 10),
        });
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencyLabels: Record<RecurringFrequency, string> = {
    daily: t('recurring.frequencies.daily'),
    weekly: t('recurring.frequencies.weekly'),
    biweekly: t('recurring.frequencies.biweekly'),
    monthly: t('recurring.frequencies.monthly'),
    yearly: t('recurring.frequencies.yearly'),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editItem ? t('recurring.edit') : t('recurring.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">{t('actions.expense')}</TabsTrigger>
              <TabsTrigger value="income">{t('actions.income')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('form.amount')}</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('budgets.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{t(cat.translationKey)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>{t('recurring.frequency')}</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {frequencyLabels[freq]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('recurring.startDate')}</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          {/* End Date (optional) */}
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('recurring.endDate')}</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>

          {/* Account (optional) */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>{t('accounts.selectAccount')}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('accounts.selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <span className="flex items-center gap-2">
                        <span>{acc.icon}</span>
                        <span>{acc.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reminder Days */}
          <div className="space-y-2">
            <Label htmlFor="reminderDays">{t('recurring.reminderDays')}</Label>
            <Input
              id="reminderDays"
              type="number"
              min="0"
              max="30"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('recurring.reminderDaysDescription')}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || !category || !startDate}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
