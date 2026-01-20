import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';

interface AddTransactionModalProps {
  isOpen: boolean;
  type: TransactionType;
  onClose: () => void;
  onAdd: (transaction: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => void;
}

export function AddTransactionModal({ isOpen, type, onClose, onAdd }: AddTransactionModalProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = () => {
    if (!amount || !selectedCategory) return;

    onAdd({
      type,
      amount: parseFloat(amount),
      category: selectedCategory,
      description,
      date: new Date().toISOString().split('T')[0],
    });

    setAmount('');
    setSelectedCategory('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 p-6 pb-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">
                {type === 'income' ? t('transactions.addIncome') : t('transactions.addExpense')}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('form.amount')}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-3xl font-bold h-16 text-center border-2 rounded-xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  {t('form.category')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground shadow-glow'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span className="text-2xl mb-1">{category.icon}</span>
                      <span className="text-xs font-medium truncate w-full text-center">
                        {t(category.translationKey)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('form.description')}
                </label>
                <Input
                  placeholder={t('form.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!amount || !selectedCategory}
                className={`w-full h-14 text-lg font-semibold rounded-xl ${
                  type === 'income' ? 'gradient-income' : 'gradient-expense'
                } text-white hover:opacity-90 transition-opacity`}
              >
                {type === 'income' ? t('transactions.addIncome') : t('transactions.addExpense')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
