import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Home, PiggyBank, Repeat, BarChart3, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTransactionsStore,
  useGoalsStore,
  useBudgetsStore,
  useRecurringStore,
  useGamificationStore
} from '@/stores';
import { TransactionType, SavingsGoal } from '@/types/finance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Core components
import { BalanceCard } from '@/components/BalanceCard';
import { QuickActions } from '@/components/QuickActions';
import { TransactionList } from '@/components/TransactionList';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CurrencySelector } from '@/components/CurrencySelector';
import { UserMenu } from '@/components/auth/UserMenu';

// Modals
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { AddGoalModal } from '@/components/AddGoalModal';
import { AddFundsModal } from '@/components/AddFundsModal';
import { StatsModal } from '@/components/StatsModal';

// Feature sections
import { BudgetOverview } from '@/components/budgets';
import { RecurringList } from '@/components/recurring';
import { AnalyticsOverview } from '@/components/analytics';
import { AchievementsOverview, LevelUpModal, UserLevel, StreakIndicator } from '@/components/gamification';

// CTA
import { FloatingActionButton, FABAction } from '@/components/cta';

import { exportTransactionsToCsv } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabValue = 'home' | 'budgets' | 'recurring' | 'analytics' | 'achievements';

const Index = () => {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();

  // Zustand stores
  const {
    transactions,
    loadTransactions,
    addTransaction,
    deleteTransaction,
    getMonthlyTransactions,
    getMonthlyIncome,
    getMonthlyExpense,
    getExpensesByCategory,
    getBalance,
  } = useTransactionsStore();

  const {
    goals,
    loadGoals,
    addGoal,
    deleteGoal,
    addToGoal,
  } = useGoalsStore();

  const { loadBudgets } = useBudgetsStore();
  const { loadRecurring } = useRecurringStore();
  const { loadGamificationData, stats, checkAchievements } = useGamificationStore();

  // UI state
  const [activeTab, setActiveTab] = useState<TabValue>('home');
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean;
    type: TransactionType;
  }>({ isOpen: false, type: 'expense' });
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [fundsModal, setFundsModal] = useState<{
    isOpen: boolean;
    goal: SavingsGoal | null;
  }>({ isOpen: false, goal: null });

  // Computed values
  const balance = getBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpense = getMonthlyExpense();
  const expensesByCategory = getExpensesByCategory();

  // Get current month's transactions
  const monthlyTransactions = useMemo(() => {
    const now = new Date();
    return getMonthlyTransactions(now.getFullYear(), now.getMonth());
  }, [getMonthlyTransactions, transactions]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadTransactions(user.id);
      loadGoals(user.id);
      loadBudgets(user.id);
      loadRecurring(user.id);
      loadGamificationData(user.id);
    }
  }, [user?.id, loadTransactions, loadGoals, loadBudgets, loadRecurring, loadGamificationData]);

  // Check achievements when data changes
  useEffect(() => {
    if (user?.id && transactions.length > 0) {
      checkAchievements({
        transactionCount: transactions.length,
        totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
        goalsCreated: goals.length,
        goalsCompleted: goals.filter((g) => g.currentAmount >= g.targetAmount).length,
        budgetsKept: 0,
      });
    }
  }, [user?.id, transactions.length, goals, checkAchievements]);

  // FAB action handler
  const handleFABAction = (action: FABAction) => {
    switch (action) {
      case 'income':
        setTransactionModal({ isOpen: true, type: 'income' });
        break;
      case 'expense':
        setTransactionModal({ isOpen: true, type: 'expense' });
        break;
      case 'goal':
        setGoalModalOpen(true);
        break;
      case 'budget':
        setActiveTab('budgets');
        break;
      case 'recurring':
        setActiveTab('recurring');
        break;
    }
  };

  const tabItems = [
    { value: 'home', icon: Home, label: t('nav.home') },
    { value: 'budgets', icon: PiggyBank, label: t('nav.budgets') },
    { value: 'recurring', icon: Repeat, label: t('nav.recurring') },
    { value: 'analytics', icon: BarChart3, label: t('nav.analytics') },
    { value: 'achievements', icon: Trophy, label: t('nav.achievements') },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-4 px-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-1"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('app.name')}
              </span>
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t('app.greeting')}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Compact gamification indicators */}
            {stats && (
              <div className="hidden sm:flex items-center gap-2 mr-1">
                <UserLevel compact />
                <StreakIndicator compact showCard={false} />
              </div>
            )}
            <ThemeToggle />
            <CurrencySelector compact />
            <LanguageSwitcher />
            {isConfigured && user ? (
              <UserMenu />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
                className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-glow animate-pulse-glow"
              >
                💰
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
        <div className="px-5 mb-4">
          <TabsList className="w-full h-auto p-1 grid grid-cols-5 bg-muted/50">
            {tabItems.map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 text-xs',
                  'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline truncate">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <main className="px-5">
          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6 mt-0">
            {/* Balance Card */}
            <BalanceCard
              balance={balance}
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
            />

            {/* Quick Actions */}
            <QuickActions
              onAddIncome={() => setTransactionModal({ isOpen: true, type: 'income' })}
              onAddExpense={() => setTransactionModal({ isOpen: true, type: 'expense' })}
              onAddGoal={() => setGoalModalOpen(true)}
              onViewStats={() => setStatsModalOpen(true)}
              onExport={() => {
                if (transactions.length === 0) {
                  toast.error(t('toast.exportError'));
                  return;
                }
                exportTransactionsToCsv(transactions);
                toast.success(t('toast.exportSuccess'));
              }}
            />

            {/* Savings Goals */}
            {goals.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    {t('goals.title')}
                  </h2>
                  <button className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
                    {t('goals.all')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <SavingsGoalCard
                      key={goal.id}
                      goal={goal}
                      onAddFunds={(id) => {
                        const g = goals.find((x) => x.id === id);
                        if (g) setFundsModal({ isOpen: true, goal: g });
                      }}
                      onDelete={deleteGoal}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Transactions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">
                  {t('transactions.title')}
                </h2>
                {monthlyTransactions.length > 5 && (
                  <button className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
                    {t('transactions.all')} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <TransactionList
                transactions={monthlyTransactions}
                onDelete={deleteTransaction}
              />
            </motion.section>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="mt-0">
            <BudgetOverview />
          </TabsContent>

          {/* Recurring Tab */}
          <TabsContent value="recurring" className="mt-0">
            <RecurringList />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-0">
            <AnalyticsOverview />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-0">
            <AchievementsOverview />
          </TabsContent>
        </main>
      </Tabs>

      {/* Floating Action Button */}
      <FloatingActionButton onAction={handleFABAction} />

      {/* Modals */}
      <AddTransactionModal
        isOpen={transactionModal.isOpen}
        type={transactionModal.type}
        onClose={() => setTransactionModal({ isOpen: false, type: 'expense' })}
        onAdd={addTransaction}
      />

      <AddGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onAdd={addGoal}
      />

      <AddFundsModal
        isOpen={fundsModal.isOpen}
        goal={fundsModal.goal}
        onClose={() => setFundsModal({ isOpen: false, goal: null })}
        onAdd={addToGoal}
      />

      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        expensesByCategory={expensesByCategory}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
      />

      {/* Level Up Modal (gamification) */}
      <LevelUpModal />
    </div>
  );
};

export default Index;
