import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es } from './locales/es';
import { he } from './locales/he';

export const LANGUAGES = ['he', 'en', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIRECTION: Record<Language, 'rtl' | 'ltr'> = { he: 'rtl', en: 'ltr', es: 'ltr' };

// Locale used for Intl number and date formatting
export const INTL_LOCALE: Record<Language, string> = { he: 'he-IL', en: 'en-GB', es: 'es-ES' };

void i18n.use(initReactI18next).init({
  resources: { he: { translation: he }, en: { translation: en }, es: { translation: es } },
  lng: 'he',
  fallbackLng: 'he',
  interpolation: { escapeValue: false },
});

export default i18n;
