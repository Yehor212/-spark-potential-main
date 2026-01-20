import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/types/finance';

interface MonthlyTrendsChartProps {
  transactions: Transaction[];
  className?: string;
  showCard?: boolean;
  months?: number;
}

interface MonthData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

export function MonthlyTrendsChart({
  transactions,
  className,
  showCard = true,
  months = 6,
}: MonthlyTrendsChartProps) {
  const { t, i18n } = useTranslation();

  const data = useMemo(() => {
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    const now = new Date();

    // Initialize months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { income: 0, expense: 0 };
    }

    // Aggregate transactions
    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        if (tx.type === 'income') {
          monthlyData[key].income += tx.amount;
        } else {
          monthlyData[key].expense += tx.amount;
        }
      }
    });

    // Convert to array with labels
    return Object.entries(monthlyData).map(([month, values]): MonthData => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthLabel = date.toLocaleDateString(i18n.language, { month: 'short' });

      return {
        month,
        monthLabel,
        income: values.income,
        expense: values.expense,
        balance: values.income - values.expense,
      };
    });
  }, [transactions, months, i18n.language]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <div className="font-medium mb-2">{label}</div>
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">
                {t(`analytics.${item.dataKey}`)}
              </span>
            </div>
            <span className="font-medium">${item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const chartContent = (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{t(`analytics.${value}`)}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2}
          dot={{ fill: 'hsl(142 71% 45%)', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="hsl(0 72% 51%)"
          strokeWidth={2}
          dot={{ fill: 'hsl(0 72% 51%)', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{t('analytics.monthlyTrends')}</CardTitle>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
}
