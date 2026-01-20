import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SavingsGoal } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';

interface AddFundsModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onAdd: (id: string, amount: number) => void;
}

export function AddFundsModal({ isOpen, goal, onClose, onAdd }: AddFundsModalProps) {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber, currencySymbol } = useCurrency();
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!amount || !goal) return;
    onAdd(goal.id, parseFloat(amount));
    setAmount('');
    onClose();
  };

  const remaining = goal ? goal.targetAmount - goal.currentAmount : 0;

  // Quick preset amounts (adjusted based on common values)
  const presetAmounts = [100, 500, 1000];

  return (
    <AnimatePresence>
      {isOpen && goal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 p-6 pb-8"
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{goal.icon}</span>
                <h2 className="text-xl font-display font-bold">{goal.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-muted rounded-xl p-4 mb-6">
              <div className="text-sm text-muted-foreground mb-1">{t('goals.remaining')}</div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(remaining)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('goals.fundAmount')}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-2xl font-bold h-14 text-center border-2 rounded-xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    onClick={() => setAmount(preset.toString())}
                    className="flex-1 rounded-xl"
                  >
                    +{formatNumber(preset)} {currencySymbol}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                {t('goals.addFunds')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
