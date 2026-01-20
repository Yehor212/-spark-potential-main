import { motion } from 'framer-motion';
import { Plus, Minus, Target, PieChart, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddGoal: () => void;
  onViewStats: () => void;
  onExport: () => void;
}

export function QuickActions({ onAddIncome, onAddExpense, onAddGoal, onViewStats, onExport }: QuickActionsProps) {
  const { t } = useTranslation();

  const actions = [
    { icon: Plus, labelKey: 'actions.income', onClick: onAddIncome, gradient: 'gradient-income' },
    { icon: Minus, labelKey: 'actions.expense', onClick: onAddExpense, gradient: 'gradient-expense' },
    { icon: Target, labelKey: 'actions.goal', onClick: onAddGoal, gradient: 'gradient-savings' },
    { icon: PieChart, labelKey: 'actions.stats', onClick: onViewStats, gradient: 'gradient-accent' },
    { icon: Download, labelKey: 'actions.export', onClick: onExport, gradient: 'gradient-primary' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-5 gap-2"
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.labelKey}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + index * 0.05 }}
        >
          <Button
            variant="ghost"
            onClick={action.onClick}
            className="flex flex-col items-center justify-center w-full h-auto py-4 px-1 rounded-2xl bg-card hover:bg-card/80 shadow-card hover:shadow-card-hover transition-all duration-300 group"
          >
            <div className={`p-3 rounded-xl ${action.gradient} mb-2 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {t(action.labelKey)}
            </span>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
