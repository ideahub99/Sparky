
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, useTheme } from '../contexts';
import type { Page, User, CreditUsage, Notification, NotificationPreferences, Tool } from '../types';
import { i18n } from '../i18n';
import { TOOL_COLORS } from '../constants/tools';
import { ACCENT_COLORS } from '../contexts';
import { PageHeader, Slider, ToggleSwitch, Button } from '../components/ui/Elements';
import { supabase } from '../lib/supabaseClient';
import { ChevronRightIcon, UserCircleIcon, BellIcon, CreditCardIcon, ChartBarIcon, LanguageIcon, SwatchIcon, InformationCircleIcon, DocumentTextIcon, ShieldCheckIcon, SparklesIcon, FaceSmileIcon, BeakerIcon, StarIcon } from '../components/icons';

// FIX: Added missing SettingsListItem component.
export const SettingsListItem: React.FC<{
    title: string;
    subtitle?: string;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
}> = ({ title, subtitle, onClick, icon: Icon, children }) => {
    return (
        <button onClick={onClick} className="flex items-center w-full text-left p-3 rounded-xl hover:bg-muted transition-colors">
            <div className="bg-muted p-2 rounded-lg me-4">
                <Icon className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-grow">
                <h3 className="font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children || <ChevronRightIcon className="w-5 h-5 text-muted-foreground rtl-flip" />}
        </button>
    );
};

// FIX: Added missing CheckIcon component.
const CheckIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

// FIX: Added missing TextPage component.
const TextPage: React.FC<{ title: string; onBack: () => void; content: React.ReactNode }> = ({ title, onBack, content }) => {
    return (
        <div>
            <PageHeader title={title} onBack={onBack} />
            <div className="p-4 prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground">
                {content}
            </div>
        </div>
    );
};

// FIX: Added missing SettingsPage component.
export const SettingsPage: React.FC<{ onNavigate: (page: Page) => void, goBack: () => void }> = ({ onNavigate, goBack }) => {
    const { t } = useTranslation();
    return (
        <div>
            <PageHeader title={t('settings.title')} onBack={goBack} />
            <div className="p-4 space-y-2">
                <SettingsListItem title={t('settings.billing.title')} subtitle={t('settings.billing.subtitle')} onClick={() => onNavigate('subscription')} icon={CreditCardIcon} />
                <SettingsListItem title={t('settings.tracking.title')} subtitle={t('settings.tracking.subtitle')} onClick={() => onNavigate('tracking')} icon={ChartBarIcon} />
                <div className="pt-4"></div>
                <SettingsListItem title={t('settings.language.title')} subtitle={t('settings.language.subtitle')} onClick={() => onNavigate('language')} icon={LanguageIcon} />
                <SettingsListItem title={t('settings.themes.title')} subtitle={t('settings.themes.subtitle')} onClick={() => onNavigate('themes')} icon={SwatchIcon} />
                 <div className="pt-4"></div>
                <SettingsListItem title={t('settings.about.title')} subtitle={t('settings.about.subtitle')} onClick={() => onNavigate('about')} icon={InformationCircleIcon} />
                <SettingsListItem title={t('settings.terms.title')} subtitle={t('settings.terms.subtitle')} onClick={() => onNavigate('terms')} icon={DocumentTextIcon} />
                <SettingsListItem title={t('settings.privacy.title')} subtitle={t('settings.privacy.subtitle')} onClick={() => onNavigate('privacy')} icon={ShieldCheckIcon} />
            </div>
        </div>
    );
};

// FIX: Added missing SubscriptionPage component.
export const SubscriptionPage: React.FC<{ goBack: () => void, onNavigate: (page: Page) => void }> = ({ goBack, onNavigate }) => {
    const { t } = useTranslation();
    return (
        <div>
            <PageHeader title={t('subscription.title')} onBack={goBack} />
            <div className="p-4 text-center">
                <p className="mb-4">{t('subscription.upgrade_plan_section')}</p>
                <Button onClick={() => {}}>{t('subscription.upgrade_button')}</Button>
            </div>
        </div>
    );
};

// FIX: Added missing ThemesPage component.
export const ThemesPage: React.FC<{ goBack: () => void }> = ({ goBack }) => {
    const { t } = useTranslation();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    return (
        <div>
            <PageHeader title={t('themes.title')} onBack={goBack} />
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="font-bold mb-2 px-2">{t('themes.app_theme')}</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {(['light', 'dark', 'system'] as const).map(th => (
                            <button key={th} onClick={() => setTheme(th)} className={`p-4 rounded-lg border-2 text-center capitalize ${theme === th ? 'border-accent text-accent' : 'border-border text-foreground'}`}>
                                {t(`themes.${th}`)}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold mb-2 px-2">{t('themes.accent_color')}</h3>
                    <div className="flex justify-around p-2 bg-card rounded-lg">
                        {ACCENT_COLORS.map(color => (
                            <button key={color.name} onClick={() => setAccentColor(color)} className="w-10 h-10 rounded-full border-2 transition-all" style={{ backgroundColor: color.hex, borderColor: accentColor.name === color.name ? 'white' : 'transparent', transform: accentColor.name === color.name ? 'scale(1.1)' : 'scale(1)' }}></button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// FIX: Added missing AboutPage component.
export const AboutPage: React.FC<{ goBack: () => void, onNavigate: (page: Page) => void }> = ({ goBack }) => {
    const { t } = useTranslation();
    return <TextPage title={t('about.title')} onBack={goBack} content={<div><h2>{t('about.main_title')}</h2><p>{t('about.p1')}</p></div>} />;
};

// FIX: Added missing PrivacyPolicyPage component.
export const PrivacyPolicyPage: React.FC<{ goBack: () => void, onNavigate: (page: Page) => void }> = ({ goBack }) => {
    const { t } = useTranslation();
    return <TextPage title={t('privacy.title')} onBack={goBack} content={<div><h2>{t('privacy.main_title')}</h2><p>{t('privacy.p1')}</p></div>} />;
};

// FIX: Added missing TermsAndConditionsPage component.
export const TermsAndConditionsPage: React.FC<{ goBack: () => void, onNavigate: (page: Page) => void }> = ({ goBack }) => {
    const { t } = useTranslation();
    return <TextPage title={t('terms.title')} onBack={goBack} content={<div><h2>{t('terms.main_title')}</h2><p>{t('terms.p1')}</p></div>} />;
};

// FIX: Added missing LanguagePage component.
export const LanguagePage: React.FC<{ goBack: () => void }> = ({ goBack }) => {
    const { t, locale, setLocale } = useTranslation();
    return (
        <div>
            <PageHeader title={t('language.title')} onBack={goBack} />
            <div className="p-4 space-y-2">
                {i18n.SUPPORTED_LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => setLocale(lang.code)} className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors ${locale === lang.code ? 'bg-muted text-accent font-semibold' : 'hover:bg-muted'}`}>
                        <span>{t(lang.name)}</span>
                        {locale === lang.code && <CheckIcon className="w-5 h-5 text-accent" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

// FIX: Added missing TrackingPage component.
export const TrackingPage: React.FC<{ goBack: () => void, creditUsage: CreditUsage[], allTools: Tool[] }> = ({ goBack, creditUsage, allTools }) => {
    const { t } = useTranslation();
    const totalUsage = creditUsage.reduce((acc, curr) => acc + curr.credits, 0);
    return (
        <div>
            <PageHeader title={t('tracking.title')} onBack={goBack} />
             <div className="p-4">
                <h2 className="text-lg font-bold">{t('tracking.total_usage_month')}</h2>
                <p className="text-3xl font-extrabold text-accent">{totalUsage} <span className="text-base font-normal text-muted-foreground">{t('tracking.credits')}</span></p>
            </div>
        </div>
    );
};

// FIX: Added missing NotificationsPage component.
export const NotificationsPage: React.FC<{ notifications: Notification[], setNotifications: (notifs: Notification[]) => void, goBack: () => void }> = ({ notifications, setNotifications, goBack }) => {
    const { t } = useTranslation();
    return (
        <div>
            <PageHeader title={t('notifications.title')} onBack={goBack} />
            <div className="p-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="font-bold text-lg">{t('notifications.empty_title')}</p>
                        <p className="text-muted-foreground">{t('notifications.empty_subtitle')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(n => <div key={n.id} className="p-3 bg-card rounded-lg">{t(n.title)}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
};

// FIX: Added missing NotificationSettingsPage component.
export const NotificationSettingsPage: React.FC<{ preferences: NotificationPreferences, onPreferencesChange: (prefs: NotificationPreferences) => void, goBack: () => void }> = ({ preferences, onPreferencesChange, goBack }) => {
    const { t } = useTranslation();
    return (
        <div>
            <PageHeader title={t('notification_settings.title')} onBack={goBack} />
            <div className="p-4 space-y-4">
                <ToggleSwitch label={t('notification_settings.promotions')} enabled={preferences.promotions} onChange={val => onPreferencesChange({...preferences, promotions: val})} />
                <ToggleSwitch label={t('notification_settings.feature_updates')} enabled={preferences.featureUpdates} onChange={val => onPreferencesChange({...preferences, featureUpdates: val})} />
                <ToggleSwitch label={t('notification_settings.general_alerts')} enabled={preferences.generalAlerts} onChange={val => onPreferencesChange({...preferences, generalAlerts: val})} />
            </div>
        </div>
    );
};

export const AccountInfoPage: React.FC<{user: User, goBack: () => void, onUserUpdate: () => void}> = ({ user, goBack, onUserUpdate }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Update username in public.users table
            if (username !== user.username) {
                const { error: profileError } = await supabase
                    .from('users')
                    .update({ username })
                    .eq('id', user.id);
                if (profileError) throw profileError;
            }

            // Update email and password in auth.users
            const updates: any = {};
            if (email !== user.email) updates.email = email;
            if (newPassword) {
                if (newPassword !== confirmPassword) throw new Error("New passwords do not match.");
                updates.password = newPassword;
            }

            if (Object.keys(updates).length > 0) {
                const { error: authError } = await supabase.auth.updateUser(updates);
                if (authError) throw authError;
            }
            
            setMessage("Account updated successfully!");
            onUserUpdate(); // Trigger a data refresh in the parent component
        } catch(e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title={t('account_info.title')} onBack={goBack} />
            <div className="p-4 space-y-6">
                <form className="space-y-4" onSubmit={handleSaveChanges}>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('signup.name_label')}</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('login.email_label')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" />
                    </div>
                    <div className="pt-4">
                         <h3 className="font-bold text-lg mb-2">{t('account_info.change_password')}</h3>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('account_info.new_password')}</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('signup.confirm_password_label')}</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" />
                        </div>
                    </div>
                    {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center pt-2">{message}</p>}
                    <Button type="submit" className="w-full !py-4 !mt-8" isLoading={loading}>{t('account_info.save_button')}</Button>
                </form>
            </div>
        </div>
    );
};
