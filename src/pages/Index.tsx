import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { TransactionType, SavingsGoal } from '@/types/finance';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickActions } from '@/components/QuickActions';
import { TransactionList } from '@/components/TransactionList';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { AddGoalModal } from '@/components/AddGoalModal';
import { AddFundsModal } from '@/components/AddFundsModal';
import { StatsModal } from '@/components/StatsModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { exportTransactionsToCsv } from '@/lib/exportCsv';
import { toast } from 'sonner';

const Index = () => {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const {
    transactions,
    savingsGoals,
    addTransaction,
    deleteTransaction,
    addSavingsGoal,
    deleteSavingsGoal,
    addToSavingsGoal,
    balance,
    monthlyIncome,
    monthlyExpense,
    monthlyTransactions,
    expensesByCategory,
  } = useFinanceStore();

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

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-5"
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
          <div className="flex items-center gap-2">
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

      <main className="px-5 space-y-6">
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
        {savingsGoals.length > 0 && (
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
              {savingsGoals.map((goal) => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onAddFunds={(id) => {
                    const g = savingsGoals.find((x) => x.id === id);
                    if (g) setFundsModal({ isOpen: true, goal: g });
                  }}
                  onDelete={deleteSavingsGoal}
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
      </main>

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
        onAdd={addSavingsGoal}
      />

      <AddFundsModal
        isOpen={fundsModal.isOpen}
        goal={fundsModal.goal}
        onClose={() => setFundsModal({ isOpen: false, goal: null })}
        onAdd={addToSavingsGoal}
      />

      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        expensesByCategory={expensesByCategory}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
      />
    </div>
  );
};

export default Index;
