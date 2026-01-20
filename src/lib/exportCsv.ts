import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';

export function exportTransactionsToCsv(transactions: Transaction[]): void {
  if (transactions.length === 0) {
    return;
  }

  const getCategoryName = (categoryId: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const headers = ['Дата', 'Тип', 'Категория', 'Сумма', 'Описание'];
  
  const rows = transactions.map((t) => [
    t.date,
    t.type === 'income' ? 'Доход' : 'Расход',
    getCategoryName(t.category, t.type),
    t.type === 'income' ? t.amount.toString() : `-${t.amount}`,
    `"${t.description.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
