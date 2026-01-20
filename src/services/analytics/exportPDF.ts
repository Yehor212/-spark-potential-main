/**
 * PDF Export Service
 * Generates a printable HTML report that can be saved as PDF
 */

import type { Transaction, Budget, SavingsGoal } from '@/types/finance';

interface ExportData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  stats: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    budgetUsage: number;
    totalBudgeted: number;
    totalSpent: number;
    savingsProgress: number;
  };
  period: string;
  userName: string;
}

export async function exportToPDF(data: ExportData): Promise<void> {
  const { transactions, budgets, goals, stats, period, userName } = data;

  // Calculate category totals
  const categoryTotals = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce(
      (acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      },
      {} as Record<string, number>
    );

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // Generate date range
  const dates = transactions.map((tx) => new Date(tx.date)).sort((a, b) => a.getTime() - b.getTime());
  const dateRange =
    dates.length > 0
      ? `${dates[0].toLocaleDateString()} - ${dates[dates.length - 1].toLocaleDateString()}`
      : 'No data';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KopiMaster - Financial Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 28px;
      color: #f59e0b;
      margin-bottom: 8px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-card .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: 600;
    }
    .stat-card.income .value { color: #10b981; }
    .stat-card.expense .value { color: #ef4444; }
    .stat-card.savings .value { color: #3b82f6; }
    .stat-card.budget .value { color: #f59e0b; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
    }
    .amount {
      font-family: 'SF Mono', Monaco, monospace;
      text-align: right;
    }
    .amount.positive { color: #10b981; }
    .amount.negative { color: #ef4444; }
    .progress-bar {
      background: #e5e7eb;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .progress-fill.healthy { background: #10b981; }
    .progress-fill.warning { background: #f59e0b; }
    .progress-fill.exceeded { background: #ef4444; }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    @media print {
      body { padding: 20px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KopiMaster</h1>
    <div class="subtitle">Financial Report for ${userName}</div>
    <div class="subtitle">${dateRange} (${period})</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card income">
      <div class="label">Monthly Income</div>
      <div class="value">$${stats.monthlyIncome.toLocaleString()}</div>
    </div>
    <div class="stat-card expense">
      <div class="label">Monthly Expenses</div>
      <div class="value">$${stats.monthlyExpense.toLocaleString()}</div>
    </div>
    <div class="stat-card savings">
      <div class="label">Monthly Savings</div>
      <div class="value">$${stats.monthlySavings.toLocaleString()}</div>
    </div>
    <div class="stat-card budget">
      <div class="label">Budget Usage</div>
      <div class="value">${stats.budgetUsage.toFixed(0)}%</div>
    </div>
  </div>

  <div class="section">
    <h2>Expenses by Category</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="amount">Amount</th>
          <th class="amount">% of Total</th>
        </tr>
      </thead>
      <tbody>
        ${sortedCategories
          .map(
            ([category, amount]) => `
          <tr>
            <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
            <td class="amount negative">$${amount.toLocaleString()}</td>
            <td class="amount">${((amount / stats.monthlyExpense) * 100).toFixed(1)}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  ${
    budgets.length > 0
      ? `
  <div class="section">
    <h2>Budget Status</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="amount">Budget</th>
          <th class="amount">Spent</th>
          <th style="width: 150px">Progress</th>
        </tr>
      </thead>
      <tbody>
        ${budgets
          .filter((b) => b.isActive)
          .map((budget) => {
            const spent = budget.spent || 0;
            const percentage = (spent / budget.monthlyLimit) * 100;
            const status = percentage >= 100 ? 'exceeded' : percentage >= budget.alertThreshold * 100 ? 'warning' : 'healthy';
            return `
          <tr>
            <td>${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}</td>
            <td class="amount">$${budget.monthlyLimit.toLocaleString()}</td>
            <td class="amount ${percentage >= 100 ? 'negative' : ''}"}>$${spent.toLocaleString()}</td>
            <td>
              <div class="progress-bar">
                <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
              </div>
            </td>
          </tr>
        `;
          })
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    goals.length > 0
      ? `
  <div class="section">
    <h2>Savings Goals</h2>
    <table>
      <thead>
        <tr>
          <th>Goal</th>
          <th class="amount">Target</th>
          <th class="amount">Current</th>
          <th style="width: 150px">Progress</th>
        </tr>
      </thead>
      <tbody>
        ${goals
          .map((goal) => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            return `
          <tr>
            <td>${goal.icon} ${goal.name}</td>
            <td class="amount">$${goal.targetAmount.toLocaleString()}</td>
            <td class="amount positive">$${goal.currentAmount.toLocaleString()}</td>
            <td>
              <div class="progress-bar">
                <div class="progress-fill healthy" style="width: ${Math.min(percentage, 100)}%"></div>
              </div>
            </td>
          </tr>
        `;
          })
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  <div class="footer">
    Generated by KopiMaster on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
  </div>
</body>
</html>
  `;

  // Open in new window for printing/saving as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
