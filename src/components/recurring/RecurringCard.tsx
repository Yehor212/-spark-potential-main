import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  MoreVertical,
  Edit2,
  Trash2,
  Pause,
  Play,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import type { RecurringTransaction } from '@/types/finance';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { useRecurringStore } from '@/stores';

interface RecurringCardProps {
  recurring: RecurringTransaction;
  currency?: string;
  onEdit?: (item: RecurringTransaction) => void;
}

export function RecurringCard({ recurring, currency = '$', onEdit }: RecurringCardProps) {
  const { t } = useTranslation();
  const { deleteRecurring, toggleActive } = useRecurringStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const categories = recurring.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const category = categories.find((c) => c.id === recurring.category);
  const categoryIcon = category?.icon || '📦';
  const categoryName = category ? t(category.translationKey) : recurring.category;

  const frequencyLabels: Record<string, string> = {
    daily: t('recurring.frequencies.daily'),
    weekly: t('recurring.frequencies.weekly'),
    biweekly: t('recurring.frequencies.biweekly'),
    monthly: t('recurring.frequencies.monthly'),
    yearly: t('recurring.frequencies.yearly'),
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getDaysUntilNext = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(recurring.nextOccurrence);
    next.setHours(0, 0, 0, 0);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilNext = getDaysUntilNext();

  const handleDelete = async () => {
    await deleteRecurring(recurring.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={`bg-card/50 border-border/50 ${!recurring.isActive ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  recurring.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                {recurring.type === 'income' ? (
                  <ArrowUpCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcon}</span>
                  <h4 className="font-medium">{recurring.description || categoryName}</h4>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {frequencyLabels[recurring.frequency]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currency}{recurring.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(recurring)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleActive(recurring.id)}>
                  {recurring.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      {t('recurring.pause')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('recurring.resume')}
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

          {/* Next occurrence */}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{t('recurring.nextOn')} {formatDate(recurring.nextOccurrence)}</span>
            </div>
            {recurring.isActive && (
              <span
                className={`font-medium ${
                  daysUntilNext <= 0
                    ? 'text-red-500'
                    : daysUntilNext <= 3
                    ? 'text-yellow-500'
                    : 'text-muted-foreground'
                }`}
              >
                {daysUntilNext <= 0
                  ? t('recurring.dueToday')
                  : daysUntilNext === 1
                  ? t('recurring.dueTomorrow')
                  : t('recurring.daysUntil', { count: daysUntilNext })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('recurring.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('recurring.deleteDescription')}
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
