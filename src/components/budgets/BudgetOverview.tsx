import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, PiggyBank, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgetsStore, useTransactionsStore } from '@/stores';
import { BudgetCard } from './BudgetCard';
import { BudgetProgressBar } from './BudgetProgressBar';
import { AddBudgetModal } from './AddBudgetModal';
import type { Budget } from '@/types/finance';

export function BudgetOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    budgets,
    loadBudgets,
    updateSpentAmounts,
    getTotalBudgeted,
    getTotalSpent,
    getBudgetsOverThreshold,
    getBudgetsExceeded,
  } = useBudgetsStore();
  const { getExpensesByCategory } = useTransactionsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBudgets(user.id);
    }
  }, [user?.id, loadBudgets]);

  // Update spent amounts when transactions change
  useEffect(() => {
    const expenses = getExpensesByCategory();
    updateSpentAmounts(expenses);
  }, [getExpensesByCategory, updateSpentAmounts]);

  const activeBudgets = budgets.filter((b) => b.isActive);
  const totalBudgeted = getTotalBudgeted();
  const totalSpent = getTotalSpent();
  const overThreshold = getBudgetsOverThreshold();
  const exceeded = getBudgetsExceeded();

  const handleEdit = (budget: Budget) => {
    setEditBudget(budget);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditBudget(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('budgets.title')}</h3>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('budgets.add')}
        </Button>
      </div>

      {/* Summary Card */}
      {activeBudgets.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{t('budgets.totalBudgeted')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{t('budgets.totalSpent')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${(totalBudgeted - totalSpent).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{t('budgets.remaining')}</div>
              </div>
            </div>

            <BudgetProgressBar
              spent={totalSpent}
              limit={totalBudgeted}
              alertThreshold={0.8}
              showLabels={false}
              size="lg"
            />

            {/* Alerts */}
            {(overThreshold.length > 0 || exceeded.length > 0) && (
              <div className="mt-4 space-y-2">
                {exceeded.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    {t('budgets.exceededCount', { count: exceeded.length })}
                  </div>
                )}
                {overThreshold.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-500">
                    <TrendingUp className="h-4 w-4" />
                    {t('budgets.warningCount', { count: overThreshold.length })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <PiggyBank className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h4 className="font-medium text-muted-foreground">{t('budgets.empty')}</h4>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
              {t('budgets.emptyDescription')}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('budgets.addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <AddBudgetModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        editBudget={editBudget}
      />
    </div>
  );
}
