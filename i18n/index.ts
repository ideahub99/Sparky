import type { Language } from '../types';
import { en } from './locales/en';
import { es } from './locales/es';
import { ar } from './locales/ar';
import { bn } from './locales/bn';
import { fr } from './locales/fr';
import { hi } from './locales/hi';
import { id } from './locales/id';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { zh } from './locales/zh';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'lang.en', nativeName: 'English' },
  { code: 'zh', name: 'lang.zh', nativeName: '中文' },
  { code: 'hi', name: 'lang.hi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'lang.es', nativeName: 'Español' },
  { code: 'ar', name: 'lang.ar', nativeName: 'العربية' },
  { code: 'fr', name: 'lang.fr', nativeName: 'Français' },
  { code: 'bn', name: 'lang.bn', nativeName: 'বাংলা' },
  { code: 'pt', name: 'lang.pt', nativeName: 'Português' },
  { code: 'ru', name: 'lang.ru', nativeName: 'Русский' },
  { code: 'id', name: 'lang.id', nativeName: 'Indonesia' },
];

type TranslationDict = { [key: string]: string };
export const translations: { [key: string]: TranslationDict } = {
  en,
  es,
  ar,
  bn,
  fr,
  hi,
  id,
  pt,
  ru,
  zh
};

export const i18n = {
  SUPPORTED_LANGUAGES,
  translations
}