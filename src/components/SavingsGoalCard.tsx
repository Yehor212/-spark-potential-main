import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SavingsGoal } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/hooks/useCurrency';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onAddFunds: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoalCard({ goal, onAddFunds, onDelete }: SavingsGoalCardProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const isComplete = goal.currentAmount >= goal.targetAmount;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-card rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{goal.icon}</div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.name}</h3>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={() => onDelete(goal.id)}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t('goals.progress', { percent: Math.round(progress) })}
          </span>
          {!isComplete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary"
              onClick={() => onAddFunds(goal.id)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {t('goals.addFunds')}
            </Button>
          )}
          {isComplete && (
            <span className="text-xs font-medium text-success">✨ {t('goals.completed')}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
