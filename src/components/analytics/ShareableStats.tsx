import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  Award,
  Calendar,
  Flame,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Transaction, Budget, SavingsGoal, UserStats } from '@/types/finance';
import { ExpensesPieChart } from './ExpensesPieChart';

interface ShareableStatsProps {
  userId: string;
}

interface PublicStats {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  userStats: UserStats | null;
  userName: string;
}

export function ShareableStats({ userId }: ShareableStatsProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<PublicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicStats() {
      if (!isSupabaseConfigured()) {
        setError('Stats not available');
        setIsLoading(false);
        return;
      }

      try {
        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        // Load transactions (last 30 days, only aggregated)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('type, category, amount, date')
          .eq('user_id', userId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

        // Load budgets
        const { data: budgets } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        // Load goals
        const { data: goals } = await supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', userId);

        // Load user stats
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        setData({
          transactions: (transactions || []).map((t) => ({
            ...t,
            id: '',
            description: '',
            createdAt: '',
          })) as Transaction[],
          budgets: (budgets || []).map((b) => ({
            id: b.id,
            userId: b.user_id,
            category: b.category,
            monthlyLimit: parseFloat(b.monthly_limit),
            alertThreshold: parseFloat(b.alert_threshold),
            isActive: b.is_active,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
            spent: 0,
          })),
          goals: (goals || []).map((g) => ({
            id: g.id,
            userId: g.user_id,
            name: g.name,
            targetAmount: parseFloat(g.target_amount),
            currentAmount: parseFloat(g.current_amount),
            icon: g.icon,
            color: g.color,
            createdAt: g.created_at,
          })),
          userStats: userStats
            ? {
                userId: userStats.user_id,
                xp: userStats.xp,
                level: userStats.level,
                currentStreak: userStats.current_streak,
                longestStreak: userStats.longest_streak,
                lastActivityDate: userStats.last_activity_date,
                totalTransactions: userStats.total_transactions,
                totalSaved: parseFloat(userStats.total_saved || '0'),
                createdAt: userStats.created_at,
                updatedAt: userStats.updated_at,
              }
            : null,
          userName: profile?.full_name || profile?.email?.split('@')[0] || 'User',
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicStats();
  }, [userId]);

  const stats = useMemo(() => {
    if (!data) return null;

    const income = data.transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = data.transactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = data.transactions
      .filter((tx) => tx.type === 'expense')
      .reduce(
        (acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        },
        {} as Record<string, number>
      );

    const goalsProgress =
      data.goals.length > 0
        ? data.goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) /
          data.goals.length
        : 0;

    return {
      income,
      expense,
      savings: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      expenses,
      goalsProgress,
      goalsCount: data.goals.length,
      goalsCompleted: data.goals.filter((g) => g.currentAmount >= g.targetAmount).length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        {error || t('analytics.notFound')}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">{data.userName}'s {t('analytics.financialStats')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('analytics.last30Days')}</p>
      </div>

      {/* Gamification Stats */}
      {data.userStats && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {t('analytics.level')} {data.userStats.level}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.userStats.xp.toLocaleString()} XP
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-500">
                <Flame className="h-5 w-5" />
                <span className="font-bold">{data.userStats.currentStreak}</span>
                <span className="text-sm text-muted-foreground">{t('analytics.dayStreak')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.income')}</span>
            </div>
            <div className="text-xl font-bold text-emerald-500">
              ${stats.income.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.expense')}</span>
            </div>
            <div className="text-xl font-bold text-red-500">
              ${stats.expense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.savingsRate')}</span>
            </div>
            <div
              className={`text-xl font-bold ${
                stats.savingsRate >= 0 ? 'text-blue-500' : 'text-red-500'
              }`}
            >
              {stats.savingsRate.toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">{t('analytics.goalsProgress')}</span>
            </div>
            <div className="text-xl font-bold text-amber-500">
              {stats.goalsCompleted}/{stats.goalsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Chart */}
      {Object.keys(stats.expenses).length > 0 && (
        <ExpensesPieChart expenses={stats.expenses} />
      )}

      {/* Goals */}
      {data.goals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t('goals.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{goal.icon}</span>
                      <span className="font-medium">{goal.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <Calendar className="h-3 w-3 inline mr-1" />
        {t('analytics.generatedAt')} {new Date().toLocaleDateString()}
        <div className="mt-2">
          {t('analytics.poweredBy')} <span className="text-primary font-medium">KopiMaster</span>
        </div>
      </div>
    </div>
  );
}
