import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/useCurrency';

interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function BalanceCard({ balance, monthlyIncome, monthlyExpense }: BalanceCardProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl gradient-hero p-6 text-white shadow-card"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-white/70 text-sm font-medium">{t('balance.title')}</span>
        </div>

        <motion.div
          key={balance}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-display font-bold mb-6"
        >
          {formatCurrency(balance)}
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-white/60 text-xs">{t('balance.income')}</span>
            </div>
            <div className="text-lg font-semibold text-emerald-400">
              +{formatCurrency(monthlyIncome)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-red-500/20">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-white/60 text-xs">{t('balance.expense')}</span>
            </div>
            <div className="text-lg font-semibold text-red-400">
              -{formatCurrency(monthlyExpense)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
