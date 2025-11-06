
import React from 'react';
import { HomeIcon, GridIcon, ClockIcon, UserIcon, ArrowLeftIcon, LogoIcon } from '../icons';
import type { Page } from '../../types';
// FIX: Corrected import path for useTranslation hook.
import { useTranslation } from '../../contexts';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ children, className, isLoading, ...props }) => {
  return (
    <button
      className={`bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 px-6 rounded-2xl transition-all duration-200 ease-in-out flex items-center justify-center shadow-lg shadow-accent/20 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Spinner small />}
      <span className={isLoading ? 'ms-2' : ''}>{children}</span>
    </button>
  );
};

// --- Slider ---
interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Slider: React.FC<SliderProps> = ({ className, ...props }) => {
  const value = props.value as number || 0;
  const min = props.min ? Number(props.min) : 0;
  const max = props.max ? Number(props.max) : 100;
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        className={`w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer range-lg accent-accent ${className}`}
        style={{ backgroundSize: `${percentage}% 100%` }}
        {...props}
      />
      <span className="font-semibold text-foreground w-10 text-center">{props.value}</span>
    </div>
  );
};

// --- Spinners and Loaders ---
interface SpinnerProps {
  small?: boolean;
}
export const Spinner: React.FC<SpinnerProps> = ({ small }) => (
  <div
    className={`animate-spin rounded-full border-t-2 border-b-2 border-accent ${
      small ? 'w-5 h-5 border-2' : 'w-12 h-12 border-4'
    }`}
    role="status"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

export const FlameLoader: React.FC = () => (
    <div className="flex items-center justify-center">
        <LogoIcon className="w-16 h-16 animate-flame text-accent" />
    </div>
);


// --- Modal ---
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closable?: boolean;
}
export const Modal: React.FC<ModalProps> = ({ title, children, onClose, closable = true }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={closable ? onClose : undefined}></div>
            <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-sm border border-border">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{title}</h2>
                    {closable && (
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none">&times;</button>
                    )}
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- BottomNav ---
interface BottomNavProps {
    activePage: Page;
    setPage: (page: Page) => void;
}
export const BottomNav: React.FC<BottomNavProps> = ({ activePage, setPage }) => {
    const { t } = useTranslation();
    const navItems = [
        { page: 'home', icon: HomeIcon, label: t('nav.home') },
        { page: 'tools', icon: GridIcon, label: t('nav.tools') },
        { page: 'history', icon: ClockIcon, label: t('nav.history') },
        { page: 'profile', icon: UserIcon, label: t('nav.profile') },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-background/80 backdrop-blur-lg border-t border-border rounded-t-2xl flex justify-around items-center z-50">
            {navItems.map(item => {
                const isActive = activePage === item.page;
                return (
                    <button key={item.page} onClick={() => setPage(item.page as Page)} className={`flex flex-col items-center justify-center w-16 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                        <item.icon className="w-6 h-6 mb-1" />
                        <span className={`text-xs font-semibold ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>{item.label}</span>
                    </button>
                )
            })}
        </div>
    )
};

// --- PageHeader ---
interface PageHeaderProps {
    title: string;
    onBack?: () => void;
    showBack?: boolean;
    children?: React.ReactNode;
}
export const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, showBack = true, children }) => {
    return (
        <div className="relative flex items-center justify-center p-4 h-16">
            {showBack && onBack && (
                <button onClick={onBack} className="absolute start-4 top-1/2 -translate-y-1/2 p-2">
                    <ArrowLeftIcon className="w-6 h-6 text-foreground rtl-flip"/>
                </button>
            )}
            <h1 className="text-lg font-bold">{title}</h1>
            {children && (
                 <div className="absolute end-4 top-1/2 -translate-y-1/2 p-2">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- ToggleSwitch ---
export const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${enabled ? 'bg-accent' : 'bg-muted'}`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

// --- ErrorDisplay ---
interface ErrorDisplayProps {
  message: string;
}
const isJsonString = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  try {
    const result = JSON.parse(str);
    return typeof result === 'object' && result !== null;
  } catch (e) {
    return false;
  }
};
const formatJson = (jsonString: string): string => {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonString;
  }
};
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  const isJson = isJsonString(message);
  const content = isJson ? formatJson(message) : message;

  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground p-4 rounded-xl z-30 text-left text-sm w-full shadow-lg backdrop-blur-sm">
      <p className="font-bold mb-2 text-red-400 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        <span>Operation Failed</span>
      </p>
      {isJson ? (
        <pre className="whitespace-pre-wrap break-words text-xs font-mono bg-background/50 p-3 rounded-md max-h-40 overflow-y-auto">
          <code>{content}</code>
        </pre>
      ) : (
        <p className="text-foreground/90">{content}</p>
      )}
    </div>
  );
};