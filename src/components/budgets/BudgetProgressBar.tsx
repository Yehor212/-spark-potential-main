import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  alertThreshold: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  currency?: string;
}

export function BudgetProgressBar({
  spent,
  limit,
  alertThreshold,
  showLabels = true,
  size = 'md',
  currency = '$',
}: BudgetProgressBarProps) {
  const { t } = useTranslation();

  const percentage = Math.min((spent / limit) * 100, 100);
  const isOverThreshold = spent / limit >= alertThreshold;
  const isExceeded = spent >= limit;

  const getProgressColor = () => {
    if (isExceeded) return 'bg-red-500';
    if (isOverThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isExceeded) return t('budgets.exceeded');
    if (isOverThreshold) return t('budgets.warning');
    return t('budgets.onTrack');
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const formatAmount = (amount: number) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatAmount(spent)} / {formatAmount(limit)}
          </span>
          <span
            className={cn(
              'font-medium',
              isExceeded && 'text-red-500',
              isOverThreshold && !isExceeded && 'text-yellow-500',
              !isOverThreshold && 'text-green-500'
            )}
          >
            {getStatusText()}
          </span>
        </div>
      )}
      <div className={cn('relative w-full bg-secondary rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', getProgressColor())}
          style={{ width: `${percentage}%` }}
        />
        {/* Alert threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/50"
          style={{ left: `${alertThreshold * 100}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage.toFixed(0)}% {t('budgets.used')}</span>
          <span>{formatAmount(limit - spent)} {t('budgets.remaining')}</span>
        </div>
      )}
    </div>
  );
}
