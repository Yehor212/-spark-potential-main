import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit2, Trash2, Pause, Play } from 'lucide-react';
import type { Budget } from '@/types/finance';
import { EXPENSE_CATEGORIES } from '@/types/finance';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useBudgetsStore } from '@/stores';

interface BudgetCardProps {
  budget: Budget;
  currency?: string;
  onEdit?: (budget: Budget) => void;
}

export function BudgetCard({ budget, currency = '$', onEdit }: BudgetCardProps) {
  const { t } = useTranslation();
  const { deleteBudget, updateBudget } = useBudgetsStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const category = EXPENSE_CATEGORIES.find((c) => c.id === budget.category);
  const categoryIcon = category?.icon || '📦';
  const categoryName = category ? t(category.translationKey) : budget.category;

  const handleToggleActive = async () => {
    await updateBudget(budget.id, { isActive: !budget.isActive });
  };

  const handleDelete = async () => {
    await deleteBudget(budget.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={`bg-card/50 border-border/50 ${!budget.isActive ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{categoryIcon}</div>
              <div>
                <h4 className="font-medium">{categoryName}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('budgets.monthlyLimit')}: {currency}{budget.monthlyLimit.toLocaleString()}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(budget)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleActive}>
                  {budget.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      {t('budgets.pause')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('budgets.resume')}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <BudgetProgressBar
            spent={budget.spent || 0}
            limit={budget.monthlyLimit}
            alertThreshold={budget.alertThreshold}
            currency={currency}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('budgets.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('budgets.deleteDescription', { category: categoryName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
