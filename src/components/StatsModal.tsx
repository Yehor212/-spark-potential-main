import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expensesByCategory: Record<string, number>;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function StatsModal({
  isOpen,
  onClose,
  expensesByCategory,
  monthlyIncome,
  monthlyExpense,
}: StatsModalProps) {
  const { t, i18n } = useTranslation();
  const { formatCurrency, locale } = useCurrency();

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

  const sortedCategories = Object.entries(expensesByCategory)
    .map(([categoryId, amount]) => {
      const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
      return {
        id: categoryId,
        translationKey: category?.translationKey || categoryId,
        icon: category?.icon || '📦',
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: category?.color || 'hsl(0 0% 50%)',
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const currentMonth = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });

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
              <div>
                <h2 className="text-xl font-display font-bold">{t('stats.title')}</h2>
                <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-muted rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('stats.incomes')}</div>
                <div className="text-xl font-bold text-income">
                  +{formatCurrency(monthlyIncome)}
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('stats.expenses')}</div>
                <div className="text-xl font-bold text-expense">
                  -{formatCurrency(monthlyExpense)}
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('stats.byCategory')}</h3>

              {sortedCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('stats.noData')}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-medium">{t(category.translationKey)}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(category.amount)}</span>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.percentage}%` }}
                          transition={{ delay: index * 0.05, duration: 0.5 }}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('stats.ofTotal', { percent: category.percentage.toFixed(1) })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
