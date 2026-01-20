import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useCurrencyContext, currencies, Currency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  className?: string;
  compact?: boolean;
}

export function CurrencySelector({ className, compact = false }: CurrencySelectorProps) {
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrencyContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCurrencies = currencies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (selected: Currency) => {
    setCurrency(selected);
    setOpen(false);
    setSearch('');
  };

  // Group currencies by region for better UX
  const popularCodes = ['USD', 'EUR', 'GBP', 'UAH', 'PLN', 'JPY'];
  const popularCurrencies = filteredCurrencies.filter(c => popularCodes.includes(c.code));
  const otherCurrencies = filteredCurrencies.filter(c => !popularCodes.includes(c.code));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            'gap-2 font-medium transition-all',
            compact ? 'h-8 px-2' : 'h-10 px-3',
            className
          )}
        >
          <span className="text-lg">{currency.flag}</span>
          <span className={cn(compact && 'hidden sm:inline')}>{currency.code}</span>
          <span className="text-muted-foreground">{currency.symbol}</span>
          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('settings.searchCurrency')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {/* Popular currencies */}
          {popularCurrencies.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {t('settings.popular')}
              </p>
              <AnimatePresence>
                {popularCurrencies.map((c, index) => (
                  <motion.button
                    key={c.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors',
                      'hover:bg-muted',
                      currency.code === c.code && 'bg-primary/10'
                    )}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{c.code}</div>
                      <div className="text-xs text-muted-foreground">{c.name}</div>
                    </div>
                    <span className="text-muted-foreground">{c.symbol}</span>
                    {currency.code === c.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Other currencies */}
          {otherCurrencies.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {t('settings.allCurrencies')}
              </p>
              {otherCurrencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors',
                    'hover:bg-muted',
                    currency.code === c.code && 'bg-primary/10'
                  )}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{c.code}</div>
                    <div className="text-xs text-muted-foreground">{c.name}</div>
                  </div>
                  <span className="text-muted-foreground">{c.symbol}</span>
                  {currency.code === c.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredCurrencies.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              {t('settings.noCurrencyFound')}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
