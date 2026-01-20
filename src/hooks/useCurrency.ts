import { useTranslation } from 'react-i18next';
import { currencyByLanguage, LanguageCode } from '@/i18n';

export function useCurrency() {
  const { i18n } = useTranslation();
  const lang = i18n.language as LanguageCode;
  const currency = currencyByLanguage[lang] || currencyByLanguage.en;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency.code === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat(currency.locale).format(amount);
  };

  return {
    formatCurrency,
    formatNumber,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    locale: currency.locale,
  };
}
