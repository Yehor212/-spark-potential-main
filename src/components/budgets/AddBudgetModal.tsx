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
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgetsStore } from '@/stores';
import { EXPENSE_CATEGORIES, type Budget } from '@/types/finance';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editBudget?: Budget | null;
}

export function AddBudgetModal({ isOpen, onClose, editBudget }: AddBudgetModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addBudget, updateBudget, budgets } = useBudgetsStore();

  const [category, setCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState([0.8]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get categories that don't already have budgets
  const existingCategories = budgets.map((b) => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !existingCategories.includes(c.id) || c.id === editBudget?.category
  );

  useEffect(() => {
    if (editBudget) {
      setCategory(editBudget.category);
      setMonthlyLimit(editBudget.monthlyLimit.toString());
      setAlertThreshold([editBudget.alertThreshold]);
    } else {
      setCategory('');
      setMonthlyLimit('');
      setAlertThreshold([0.8]);
    }
  }, [editBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || !monthlyLimit) return;

    setIsSubmitting(true);

    try {
      if (editBudget) {
        await updateBudget(editBudget.id, {
          category,
          monthlyLimit: parseFloat(monthlyLimit),
          alertThreshold: alertThreshold[0],
        });
      } else {
        await addBudget({
          userId: user.id,
          category,
          monthlyLimit: parseFloat(monthlyLimit),
          alertThreshold: alertThreshold[0],
          isActive: true,
        });
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editBudget ? t('budgets.edit') : t('budgets.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.category')}</Label>
            <Select value={category} onValueChange={setCategory} disabled={!!editBudget}>
              <SelectTrigger>
                <SelectValue placeholder={t('budgets.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
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

          <div className="space-y-2">
            <Label htmlFor="limit">{t('budgets.monthlyLimit')}</Label>
            <Input
              id="limit"
              type="number"
              min="1"
              step="any"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('budgets.alertThreshold')}</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(alertThreshold[0] * 100)}%
              </span>
            </div>
            <Slider
              value={alertThreshold}
              onValueChange={setAlertThreshold}
              min={0.5}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t('budgets.alertThresholdDescription', {
                percent: Math.round(alertThreshold[0] * 100),
              })}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !category || !monthlyLimit}
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
