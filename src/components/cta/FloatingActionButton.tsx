import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FABAction = 'income' | 'expense' | 'goal' | 'budget' | 'recurring';

interface FloatingActionButtonProps {
  onAction: (action: FABAction) => void;
  className?: string;
}

export function FloatingActionButton({ onAction, className }: FloatingActionButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const actions: Array<{ id: FABAction; icon: React.ReactNode; label: string; color: string }> = [
    {
      id: 'income',
      icon: <TrendingUp className="h-5 w-5" />,
      label: t('fab.addIncome'),
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
    {
      id: 'expense',
      icon: <TrendingDown className="h-5 w-5" />,
      label: t('fab.addExpense'),
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'goal',
      icon: <Target className="h-5 w-5" />,
      label: t('fab.addGoal'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'budget',
      icon: <PiggyBank className="h-5 w-5" />,
      label: t('fab.addBudget'),
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      id: 'recurring',
      icon: <Repeat className="h-5 w-5" />,
      label: t('fab.addRecurring'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const handleAction = (action: FABAction) => {
    setIsOpen(false);
    onAction(action);
  };

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleAction(action.id)}
                className="flex items-center gap-3"
              >
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-medium whitespace-nowrap shadow-lg"
                >
                  {action.label}
                </motion.span>
                <div
                  className={cn(
                    'h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition-colors',
                    action.color
                  )}
                >
                  {action.icon}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors',
          isOpen
            ? 'bg-muted-foreground hover:bg-muted-foreground/90'
            : 'bg-primary hover:bg-primary/90 shadow-glow'
        )}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
