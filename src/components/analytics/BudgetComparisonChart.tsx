import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EXPENSE_CATEGORIES, type Budget } from '@/types/finance';

interface BudgetComparisonChartProps {
  budgets: Budget[];
  className?: string;
  showCard?: boolean;
}

interface ChartData {
  category: string;
  categoryLabel: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'exceeded';
}

export function BudgetComparisonChart({
  budgets,
  className,
  showCard = true,
}: BudgetComparisonChartProps) {
  const { t } = useTranslation();

  const data = useMemo((): ChartData[] => {
    return budgets
      .filter((b) => b.isActive)
      .map((budget) => {
        const spent = budget.spent || 0;
        const percentage = (spent / budget.monthlyLimit) * 100;
        let status: 'healthy' | 'warning' | 'exceeded' = 'healthy';

        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= budget.alertThreshold * 100) {
          status = 'warning';
        }

        const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.id === budget.category);

        return {
          category: budget.category,
          categoryLabel: categoryInfo?.icon + ' ' + t(`categories.expense.${budget.category}`),
          budgeted: budget.monthlyLimit,
          spent,
          remaining: Math.max(0, budget.monthlyLimit - spent),
          percentage,
          status,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, t]);

  const getBarColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'hsl(0 72% 51%)';
      case 'warning':
        return 'hsl(45 93% 47%)';
      default:
        return 'hsl(142 71% 45%)';
    }
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartData }>;
  }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <div className="font-medium mb-2">{item.categoryLabel}</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('budgets.monthlyLimit')}:</span>
            <span className="font-medium">${item.budgeted.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('budgets.spent')}:</span>
            <span className="font-medium" style={{ color: getBarColor(item.status) }}>
              ${item.spent.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('budgets.remaining')}:</span>
            <span className="font-medium">${item.remaining.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-muted-foreground">{t('analytics.usage')}:</span>
            <span className="font-medium">{item.percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const chartContent = (
    <>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t('budgets.empty')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-border/50" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              className="text-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="categoryLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={100}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{t(`analytics.${value}`)}</span>
              )}
            />
            <Bar
              dataKey="budgeted"
              fill="hsl(var(--muted))"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{t('analytics.budgetComparison')}</CardTitle>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
}
