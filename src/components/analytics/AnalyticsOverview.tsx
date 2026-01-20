import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Download,
  Share2,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactionsStore, useBudgetsStore, useGoalsStore } from '@/stores';
import { ExpensesPieChart } from './ExpensesPieChart';
import { MonthlyTrendsChart } from './MonthlyTrendsChart';
import { BudgetComparisonChart } from './BudgetComparisonChart';
import { exportToPDF } from '@/services/analytics/exportPDF';

type Period = '1m' | '3m' | '6m' | '12m' | 'all';

export function AnalyticsOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    transactions,
    loadTransactions,
    getExpensesByCategory,
    getMonthlyIncome,
    getMonthlyExpense,
  } = useTransactionsStore();
  const { budgets, loadBudgets, updateSpentAmounts, getTotalBudgeted, getTotalSpent } =
    useBudgetsStore();
  const { goals, loadGoals } = useGoalsStore();

  const [period, setPeriod] = useState<Period>('6m');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTransactions(user.id);
      loadBudgets(user.id);
      loadGoals(user.id);
    }
  }, [user?.id, loadTransactions, loadBudgets, loadGoals]);

  useEffect(() => {
    const expenses = getExpensesByCategory();
    updateSpentAmounts(expenses);
  }, [getExpensesByCategory, updateSpentAmounts]);

  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;

    const months = parseInt(period);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    return transactions.filter((tx) => new Date(tx.date) >= cutoff);
  }, [transactions, period]);

  const expenses = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce(
        (acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        },
        {} as Record<string, number>
      );
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    const monthlyIncome = getMonthlyIncome();
    const monthlyExpense = getMonthlyExpense();
    const totalBudgeted = getTotalBudgeted();
    const totalSpent = getTotalSpent();
    const savingsGoalProgress = goals.reduce(
      (acc, g) => ({
        current: acc.current + g.currentAmount,
        target: acc.target + g.targetAmount,
      }),
      { current: 0, target: 0 }
    );

    return {
      monthlyIncome,
      monthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense,
      budgetUsage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      totalBudgeted,
      totalSpent,
      savingsProgress:
        savingsGoalProgress.target > 0
          ? (savingsGoalProgress.current / savingsGoalProgress.target) * 100
          : 0,
    };
  }, [getMonthlyIncome, getMonthlyExpense, getTotalBudgeted, getTotalSpent, goals]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        transactions: filteredTransactions,
        budgets,
        goals,
        stats,
        period,
        userName: user?.email || 'User',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    if (user?.id) {
      const shareUrl = `${window.location.origin}/stats/${user.id}`;
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const periodMonths = period === 'all' ? 12 : parseInt(period);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('analytics.title')}</h3>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">{t('analytics.periods.1m')}</SelectItem>
              <SelectItem value="3m">{t('analytics.periods.3m')}</SelectItem>
              <SelectItem value="6m">{t('analytics.periods.6m')}</SelectItem>
              <SelectItem value="12m">{t('analytics.periods.12m')}</SelectItem>
              <SelectItem value="all">{t('analytics.periods.all')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.monthlyIncome')}</span>
            </div>
            <div className="text-xl font-bold text-emerald-500">
              ${stats.monthlyIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.monthlyExpense')}</span>
            </div>
            <div className="text-xl font-bold text-red-500">
              ${stats.monthlyExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.monthlySavings')}</span>
            </div>
            <div
              className={`text-xl font-bold ${
                stats.monthlySavings >= 0 ? 'text-blue-500' : 'text-red-500'
              }`}
            >
              ${stats.monthlySavings.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.budgetUsage')}</span>
            </div>
            <div
              className={`text-xl font-bold ${
                stats.budgetUsage > 100
                  ? 'text-red-500'
                  : stats.budgetUsage > 80
                    ? 'text-amber-500'
                    : 'text-amber-500'
              }`}
            >
              {stats.budgetUsage.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ExpensesPieChart expenses={expenses} />
      <MonthlyTrendsChart transactions={filteredTransactions} months={periodMonths} />
      <BudgetComparisonChart budgets={budgets} />

      {/* Empty State */}
      {transactions.length === 0 && (
        <Card className="bg-card/50 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h4 className="font-medium text-muted-foreground">{t('analytics.noData')}</h4>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {t('analytics.noDataDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
