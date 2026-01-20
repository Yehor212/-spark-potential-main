import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const { t } = useTranslation();
  const { formatCurrency, locale } = useCurrency();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('transactions.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('transactions.yesterday');
    } else {
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    }
  };

  const getCategory = (categoryId: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const found = categories.find((c) => c.id === categoryId);
    return found || { icon: '📦', translationKey: categoryId };
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{t('transactions.empty.title')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('transactions.empty.description')}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.slice(0, 5).map((date) => (
        <div key={date}>
          <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
            {formatDate(date)}
          </div>
          <AnimatePresence mode="popLayout">
            {groupedTransactions[date].map((transaction, index) => {
              const category = getCategory(transaction.category, transaction.type);
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-card rounded-xl mb-2 shadow-sm hover:shadow-card transition-shadow group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{category.icon}</div>
                    <div>
                      <div className="font-medium text-foreground">
                        {t(category.translationKey)}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
