import { useCurrencyContext } from '@/contexts/CurrencyContext';

/**
 * Hook for currency formatting
 * Uses CurrencyContext for selected currency (independent of language)
 */
export function useCurrency() {
  const { currency, formatCurrency, formatNumber } = useCurrencyContext();

  return {
    formatCurrency,
    formatNumber,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    locale: currency.locale,
    currency,
  };
}
