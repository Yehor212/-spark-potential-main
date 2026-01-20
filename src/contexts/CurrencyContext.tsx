import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', locale: 'uk-UA', flag: '🇺🇦' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL', flag: '🇵🇱' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', flag: '🇨🇳' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', flag: '🇰🇷' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'hi-IN', flag: '🇮🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', flag: '🇧🇷' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', locale: 'de-CH', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK', flag: '🇩🇰' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ', flag: '🇨🇿' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU', flag: '🇭🇺' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', locale: 'ro-RO', flag: '🇷🇴' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR', flag: '🇹🇷' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', locale: 'he-IL', flag: '🇮🇱' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', flag: '🇦🇪' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX', flag: '🇲🇽' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU', flag: '🇷🇺' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  formatNumber: (amount: number) => string;
}

const CURRENCY_STORAGE_KEY = 'kopimaster_currency';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored) {
        const found = currencies.find(c => c.code === stored);
        if (found) return found;
      }
      // Default based on browser locale
      const browserLocale = navigator.language;
      const localeMap: Record<string, string> = {
        'uk': 'UAH', 'ru': 'RUB', 'pl': 'PLN', 'de': 'EUR', 'fr': 'EUR',
        'es': 'EUR', 'ja': 'JPY', 'zh': 'CNY', 'ko': 'KRW', 'hi': 'INR',
      };
      const lang = browserLocale.split('-')[0];
      const defaultCode = localeMap[lang] || 'USD';
      return currencies.find(c => c.code === defaultCode) || currencies[0];
    }
    return currencies[0];
  });

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency.code);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
    }).format(amount);
  };

  const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat(currency.locale).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, formatNumber }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
}
