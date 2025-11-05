import { createContext, useContext } from 'react';
import { translations } from './i18n';

// --- I1n Setup ---
const defaultLocale = 'en';
type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
};

export const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
  setLocale: () => console.warn('No locale provider'),
  t: (key) => key,
});

export const useTranslation = () => useContext(LocaleContext);


// --- Theme Setup ---
export type Theme = "light" | "dark" | "system";
export type AccentColor = { name: string; value: string; hex: string; };

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const ACCENT_COLORS: AccentColor[] = [
    { name: 'purple', value: '263 91% 65%', hex: '#a855f7' },
    { name: 'red', value: '0 84.2% 60.2%', hex: '#ef4444' },
    { name: 'blue', value: '221.2 83.2% 53.3%', hex: '#3b82f6' },
    { name: 'green', value: '145.1 63.4% 45.9%', hex: '#22c55e' },
    { name: 'yellow', value: '45.4 93.4% 51.6%', hex: '#facc15' },
];