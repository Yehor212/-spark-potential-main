import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EXPENSE_CATEGORIES } from '@/types/finance';

interface ExpensesPieChartProps {
  expenses: Record<string, number>;
  className?: string;
  showCard?: boolean;
}

export function ExpensesPieChart({ expenses, className, showCard = true }: ExpensesPieChartProps) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    return Object.entries(expenses)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => {
        const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.id === category);
        return {
          name: t(`categories.expense.${category}`),
          value: amount,
          color: categoryInfo?.color || 'hsl(0 0% 50%)',
          icon: categoryInfo?.icon || '📦',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, t]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; icon: string } }> }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 font-medium">
          <span>{item.icon}</span>
          <span>{item.name}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          ${item.value.toLocaleString()} ({percentage}%)
        </div>
      </div>
    );
  };

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {data.slice(0, 6).map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-xs">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  );

  const chartContent = (
    <>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          {t('stats.noData')}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {renderLegend()}
        </>
      )}
    </>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{t('stats.byCategory')}</CardTitle>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
}
