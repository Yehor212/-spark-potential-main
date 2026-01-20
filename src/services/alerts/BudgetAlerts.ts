/**
 * Budget Alerts Service
 * Monitors budgets and triggers alerts when thresholds are reached
 */

import type { Budget } from '@/types/finance';
import { toast } from 'sonner';

export interface BudgetAlert {
  budgetId: string;
  category: string;
  type: 'warning' | 'exceeded';
  percentage: number;
  spent: number;
  limit: number;
  message: string;
}

class BudgetAlertsService {
  private alertedBudgets: Map<string, 'warning' | 'exceeded'> = new Map();
  private categoryNames: Record<string, string> = {};

  /**
   * Set translated category names for alerts
   */
  setCategoryNames(names: Record<string, string>) {
    this.categoryNames = names;
  }

  /**
   * Check budgets and generate alerts
   */
  checkBudgets(budgets: Budget[]): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      if (!budget.isActive || !budget.spent) continue;

      const percentage = budget.spent / budget.monthlyLimit;
      const currentAlertType = this.alertedBudgets.get(budget.id);
      const categoryName = this.categoryNames[budget.category] || budget.category;

      // Check if exceeded
      if (percentage >= 1 && currentAlertType !== 'exceeded') {
        alerts.push({
          budgetId: budget.id,
          category: budget.category,
          type: 'exceeded',
          percentage: percentage * 100,
          spent: budget.spent,
          limit: budget.monthlyLimit,
          message: `${categoryName} budget exceeded! You've spent $${budget.spent.toLocaleString()} of $${budget.monthlyLimit.toLocaleString()}`,
        });
        this.alertedBudgets.set(budget.id, 'exceeded');
      }
      // Check if over threshold but not exceeded
      else if (
        percentage >= budget.alertThreshold &&
        percentage < 1 &&
        currentAlertType !== 'warning' &&
        currentAlertType !== 'exceeded'
      ) {
        const percentageStr = Math.round(percentage * 100);
        alerts.push({
          budgetId: budget.id,
          category: budget.category,
          type: 'warning',
          percentage: percentage * 100,
          spent: budget.spent,
          limit: budget.monthlyLimit,
          message: `${categoryName} budget at ${percentageStr}%! $${(budget.monthlyLimit - budget.spent).toLocaleString()} remaining`,
        });
        this.alertedBudgets.set(budget.id, 'warning');
      }
      // Reset if back under threshold
      else if (percentage < budget.alertThreshold && currentAlertType) {
        this.alertedBudgets.delete(budget.id);
      }
    }

    return alerts;
  }

  /**
   * Display toast notifications for alerts
   */
  showToastAlerts(alerts: BudgetAlert[]) {
    for (const alert of alerts) {
      if (alert.type === 'exceeded') {
        toast.error(alert.message, {
          duration: 5000,
          icon: '🚨',
        });
      } else {
        toast.warning(alert.message, {
          duration: 4000,
          icon: '⚠️',
        });
      }
    }
  }

  /**
   * Check budgets and show toast alerts
   */
  checkAndAlert(budgets: Budget[]) {
    const alerts = this.checkBudgets(budgets);
    this.showToastAlerts(alerts);
    return alerts;
  }

  /**
   * Reset alerts (e.g., at start of new month)
   */
  resetAlerts() {
    this.alertedBudgets.clear();
  }

  /**
   * Get summary of budget health
   */
  getBudgetHealthSummary(budgets: Budget[]): {
    total: number;
    healthy: number;
    warning: number;
    exceeded: number;
    totalBudgeted: number;
    totalSpent: number;
  } {
    const activeBudgets = budgets.filter((b) => b.isActive);

    let healthy = 0;
    let warning = 0;
    let exceeded = 0;
    let totalBudgeted = 0;
    let totalSpent = 0;

    for (const budget of activeBudgets) {
      totalBudgeted += budget.monthlyLimit;
      totalSpent += budget.spent || 0;

      const percentage = (budget.spent || 0) / budget.monthlyLimit;

      if (percentage >= 1) {
        exceeded++;
      } else if (percentage >= budget.alertThreshold) {
        warning++;
      } else {
        healthy++;
      }
    }

    return {
      total: activeBudgets.length,
      healthy,
      warning,
      exceeded,
      totalBudgeted,
      totalSpent,
    };
  }
}

// Singleton instance
export const budgetAlertsService = new BudgetAlertsService();
