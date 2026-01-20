import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import uk from './locales/uk.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import ja from './locales/ja.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

// Currency mapping by language
export const currencyByLanguage: Record<LanguageCode, { code: string; symbol: string; locale: string }> = {
  en: { code: 'USD', symbol: '$', locale: 'en-US' },
  uk: { code: 'UAH', symbol: '₴', locale: 'uk-UA' },
  fr: { code: 'EUR', symbol: '€', locale: 'fr-FR' },
  de: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  es: { code: 'EUR', symbol: '€', locale: 'es-ES' },
  ja: { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
};

const resources = {
  en: { translation: en },
  uk: { translation: uk },
  fr: { translation: fr },
  de: { translation: de },
  es: { translation: es },
  ja: { translation: ja },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kopimaster_language',
    },
  });

export default i18n;
