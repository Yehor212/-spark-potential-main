import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Repeat, Bell, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecurringStore } from '@/stores';
import { RecurringCard } from './RecurringCard';
import { AddRecurringModal } from './AddRecurringModal';
import type { RecurringTransaction } from '@/types/finance';

export function RecurringList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    recurringTransactions,
    loadRecurring,
    processRecurringTransactions,
    getUpcomingReminders,
    getActiveRecurring,
    getNextDueDate,
  } = useRecurringStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<RecurringTransaction | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadRecurring(user.id);
    }
  }, [user?.id, loadRecurring]);

  // Process due recurring transactions on load
  useEffect(() => {
    if (user?.id) {
      processRecurringTransactions(user.id).then((count) => {
        setProcessedCount(count);
      });
    }
  }, [user?.id, processRecurringTransactions]);

  const activeItems = getActiveRecurring();
  const upcomingReminders = getUpcomingReminders(7); // Next 7 days
  const nextDueDate = getNextDueDate();

  const handleEdit = (item: RecurringTransaction) => {
    setEditItem(item);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditItem(null);
  };

  const formatNextDue = () => {
    if (!nextDueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = nextDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return t('recurring.dueToday');
    if (diffDays === 1) return t('recurring.dueTomorrow');
    return t('recurring.daysUntil', { count: diffDays });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('recurring.title')}</h3>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('recurring.add')}
        </Button>
      </div>

      {/* Summary/Alerts */}
      {activeItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            {t('recurring.activeCount', { count: activeItems.length })}
          </Badge>
          {nextDueDate && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatNextDue()}
            </Badge>
          )}
          {upcomingReminders.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500">
              <Bell className="h-3 w-3" />
              {t('recurring.remindersCount', { count: upcomingReminders.length })}
            </Badge>
          )}
        </div>
      )}

      {/* Processed notification */}
      {processedCount > 0 && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 text-sm text-green-500">
            {t('recurring.processedCount', { count: processedCount })}
          </CardContent>
        </Card>
      )}

      {/* Recurring List */}
      {recurringTransactions.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Repeat className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h4 className="font-medium text-muted-foreground">{t('recurring.empty')}</h4>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
              {t('recurring.emptyDescription')}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('recurring.addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Due soon section */}
          {upcomingReminders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-yellow-500 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t('recurring.dueSoon')}
              </h4>
              {upcomingReminders.map((item) => (
                <RecurringCard key={item.id} recurring={item} onEdit={handleEdit} />
              ))}
            </div>
          )}

          {/* All recurring */}
          <div className="space-y-2">
            {upcomingReminders.length > 0 && (
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('recurring.all')}
              </h4>
            )}
            {recurringTransactions
              .filter((r) => !upcomingReminders.some((ur) => ur.id === r.id))
              .map((item) => (
                <RecurringCard key={item.id} recurring={item} onEdit={handleEdit} />
              ))}
          </div>
        </div>
      )}

      <AddRecurringModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        editItem={editItem}
      />
    </div>
  );
}
