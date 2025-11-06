

import React, { useState, useEffect, useMemo } from 'react';
import type { Page, User, Plan, Notification, NotificationPreferences, CreditUsage, Tool, Language } from '../types';
import { useTranslation, useTheme, ACCENT_COLORS } from '../contexts';
import type { Theme, AccentColor } from '../contexts';
import { PageHeader, Button, ToggleSwitch } from '../components/ui/Elements';
import { supabase } from '../lib/supabaseClient';
import {
    CreditCardIcon,
    SwatchIcon,
    LanguageIcon,
    InformationCircleIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ChevronRightIcon,
    UserCircleIcon,
    AtSymbolIcon,
    KeyIcon,
    ChartBarIcon,
    BellIcon,
    StarIcon,
} from '../components/icons';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { TOOL_COLORS } from '../constants/tools';

const SettingsListItem: React.FC<{
    title: string;
    icon: React.ComponentType<{className?: string}>;
    onClick: () => void;
}> = ({ title, icon: Icon, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center text-left p-4 bg-card rounded-lg hover:bg-muted transition-colors border border-border">
        <Icon className="w-6 h-6 me-4 text-muted-foreground" />
        <div className="flex-grow">
            <p className="font-semibold">{title}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-muted-foreground rtl-flip" />
    </button>
);


export const SettingsPage: React.FC<{ onNavigate: (page: Page) => void; goBack: () => void; }> = ({ onNavigate, goBack }) => {
    const { t } = useTranslation();
    const menuItems = [
        { page: 'subscription', icon: CreditCardIcon, label: 'settings.subscription_title' },
        { page: 'themes', icon: SwatchIcon, label: 'settings.themes_title' },
        { page: 'language', icon: LanguageIcon, label: 'settings.language_title' },
        { page: 'tracking', icon: ChartBarIcon, label: 'settings.tracking_title' },
        { page: 'notification-settings', icon: BellIcon, label: 'settings.notifications_title'},
        { page: 'about', icon: InformationCircleIcon, label: 'settings.about_title' },
        { page: 'privacy', icon: ShieldCheckIcon, label: 'settings.privacy_title' },
        { page: 'terms', icon: DocumentTextIcon, label: 'settings.terms_title' },
    ];
    return (
        <div>
            <PageHeader title={t('settings.title')} onBack={goBack} />
            <div className="p-4 space-y-3">
                {menuItems.map(item => (
                    <SettingsListItem 
                        key={item.page}
                        title={t(item.label)} 
                        icon={item.icon} 
                        onClick={() => onNavigate(item.page as Page)} 
                    />
                ))}
            </div>
        </div>
    );
};

export const SubscriptionPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; user: User | null; plans: Plan[] }> = ({ goBack, user, plans }) => {
    const { t } = useTranslation();
    const currentPlan = user?.plan;
    const sortedPlans = [...plans].sort((a, b) => a.id - b.id);

    return (
        <div className="p-4 h-full flex flex-col">
            <PageHeader title={t('subscription.title')} onBack={goBack} />
            <div className="space-y-4 flex-grow">
                {sortedPlans.map(plan => {
                    const isCurrent = plan.id === currentPlan?.id;
                    return (
                        <div key={plan.id} className={`p-5 rounded-xl border-2 ${isCurrent ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                            {isCurrent && <p className="text-xs font-bold text-accent mb-1">{t('subscription.current_plan')}</p>}
                            <div className="flex justify-between items-baseline">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                {plan.price_usd && (
                                    <p className="text-2xl font-bold">${plan.price_usd}<span className="text-sm font-normal text-muted-foreground">{t('subscription.per_month')}</span></p>
                                )}
                            </div>
                            {/* FIX: Convert number to string for translation function. */}
                            <p className="text-muted-foreground my-2">{t('subscription.plan_credits', { count: plan.monthly_credits.toString() })}</p>
                            <ul className="text-sm space-y-1 my-4">
                                <li>✓ {t('subscription.feature1')}</li>
                                <li>✓ {t('subscription.feature2')}</li>
                                {plan.id > 1 && <li>✓ {t('subscription.feature3')}</li>}
                            </ul>
                            <Button className="w-full" disabled={isCurrent}>{isCurrent ? t('subscription.subscribed_button') : t('subscription.upgrade_button')}</Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ThemesPage: React.FC<{ goBack: () => void }> = ({ goBack }) => {
    const { t } = useTranslation();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const themes: { name: string, value: Theme }[] = [{ name: 'theme.light', value: 'light'}, { name: 'theme.dark', value: 'dark'}, { name: 'theme.system', value: 'system'}];

    return (
        <div className="p-4">
            <PageHeader title={t('themes.title')} onBack={goBack} />
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold mb-3 px-2">{t('themes.mode_title')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {themes.map(th => (
                            <button key={th.value} onClick={() => setTheme(th.value)} className={`p-4 rounded-lg border-2 ${theme === th.value ? 'border-accent' : 'border-border bg-card'}`}>
                                {t(th.name)}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold mb-3 px-2">{t('themes.accent_title')}</h3>
                    <div className="flex flex-wrap gap-4 p-2">
                        {ACCENT_COLORS.map(color => (
                            <button key={color.name} onClick={() => setAccentColor(color)}
                                className="w-10 h-10 rounded-full border-4"
                                style={{ backgroundColor: color.hex, borderColor: accentColor.name === color.name ? 'white' : 'transparent' }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TextPage: React.FC<{ title: string; content: string[]; goBack: () => void }> = ({ title, content, goBack }) => (
    <div className="p-4">
        <PageHeader title={title} onBack={goBack} />
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            {content.map((p, i) => <p key={i}>{p}</p>)}
        </div>
    </div>
);

export const AboutPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; }> = ({ goBack }) => {
    const { t } = useTranslation();
    return <TextPage title={t('about.title')} content={[t('about.p1'), t('about.p2')]} goBack={goBack} />;
};
export const PrivacyPolicyPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; }> = ({ goBack }) => {
    const { t } = useTranslation();
    return <TextPage title={t('privacy.title')} content={[t('privacy.p1'), t('privacy.p2'), t('privacy.p3')]} goBack={goBack} />;
};
export const TermsAndConditionsPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; }> = ({ goBack }) => {
    const { t } = useTranslation();
    return <TextPage title={t('terms.title')} content={[t('terms.p1'), t('terms.p2'), t('terms.p3')]} goBack={goBack} />;
};

export const LanguagePage: React.FC<{ goBack: () => void; }> = ({ goBack }) => {
    const { t, locale, setLocale } = useTranslation();
    return (
        <div>
            <PageHeader title={t('language.title')} onBack={goBack} />
            <div className="p-4 space-y-2">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => setLocale(lang.code)} className={`w-full text-left p-4 rounded-lg font-semibold ${locale === lang.code ? 'bg-accent text-accent-foreground' : 'bg-card'}`}>
                        {t(lang.name)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const TrackingPage: React.FC<{ goBack: () => void; creditUsage: CreditUsage[]; allTools: Tool[] }> = ({ goBack, creditUsage, allTools }) => {
    const { t } = useTranslation();

    const usageByTool = useMemo(() => {
        const usageMap = new Map<string, number>();
        creditUsage.forEach(usage => {
            usageMap.set(usage.toolName, (usageMap.get(usage.toolName) || 0) + usage.credits);
        });
        return Array.from(usageMap.entries())
            .map(([toolName, credits]) => ({
                toolName,
                credits,
                tool: allTools.find(t => t.name === toolName)
            }))
            .sort((a, b) => b.credits - a.credits);
    }, [creditUsage, allTools]);

    const totalCreditsUsed = usageByTool.reduce((sum, item) => sum + item.credits, 0);

    return (
        <div>
            <PageHeader title={t('tracking.title')} onBack={goBack} />
            <div className="p-4 space-y-6">
                <div className="bg-card border border-border p-4 rounded-xl text-center">
                    <p className="text-muted-foreground">{t('tracking.total_used')}</p>
                    <p className="text-4xl font-extrabold">{totalCreditsUsed}</p>
                </div>
                <div className="space-y-3">
                    {usageByTool.map(({ toolName, credits, tool }) => (
                        <div key={toolName} className="flex items-center bg-card border border-border p-3 rounded-lg">
                            {tool && <tool.icon className="w-8 h-8 me-4 p-1.5 rounded-md" style={{ backgroundColor: TOOL_COLORS[tool.id] || TOOL_COLORS.default, color: 'white' }} />}
                            <div className="flex-grow">
                                <p className="font-semibold">{t(toolName)}</p>
                                {/* FIX: Convert number to string for translation function. */}
                                <p className="text-sm text-muted-foreground">{t('tracking.credits_used', { count: credits.toString() })}</p>
                            </div>
                            <p className="font-bold text-lg">{credits}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AccountInfoPage: React.FC<{ user: User; goBack: () => void; onUserUpdate: () => void; }> = ({ user, goBack, onUserUpdate }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleUpdateUser = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        if (user.username !== username) {
            const { error } = await supabase.auth.updateUser({ data: { username } });
            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }
            setMessage(t('account.update_success'));
            onUserUpdate();
        }
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (password !== confirmPassword) {
            setError(t('signup.error_passwords_mismatch'));
            return;
        }
        if (!password) {
             setError(t('account.error_password_empty'));
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message);
        } else {
            setMessage(t('account.password_success'));
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col">
            <PageHeader title={t('account.title')} onBack={goBack} />
            <div className="p-4 space-y-6 flex-grow overflow-y-auto">
                <div className="p-4 bg-card rounded-lg border border-border space-y-4">
                    <h3 className="font-bold">{t('account.profile_section')}</h3>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UserCircleIcon className="w-4 h-4" />{t('signup.name_label')}</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 bg-background border border-border rounded-lg p-3" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AtSymbolIcon className="w-4 h-4" />{t('login.email_label')}</label>
                        <input type="email" value={user.email} className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-muted-foreground" disabled />
                    </div>
                    <Button onClick={handleUpdateUser} isLoading={loading} disabled={username === user.username} className="w-full">{t('account.save_changes')}</Button>
                </div>

                <div className="p-4 bg-card rounded-lg border border-border space-y-4">
                    <h3 className="font-bold">{t('account.password_section')}</h3>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><KeyIcon className="w-4 h-4" />{t('account.new_password')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 bg-background border border-border rounded-lg p-3" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><KeyIcon className="w-4 h-4" />{t('signup.confirm_password_label')}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full mt-1 bg-background border border-border rounded-lg p-3" />
                    </div>
                    <Button onClick={handleUpdatePassword} isLoading={loading} className="w-full">{t('account.update_password')}</Button>
                </div>
                {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
                {message && <p className="text-green-500 text-sm text-center pt-2">{message}</p>}
            </div>
        </div>
    );
};

export const NotificationsPage: React.FC<{ notifications: Notification[]; setNotifications: (n: Notification[]) => void; goBack: () => void; }> = ({ notifications, setNotifications, goBack }) => {
    const { t } = useTranslation();
    
    useEffect(() => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            supabase.from('notifications').update({ read: true }).in('id', unreadIds).then(() => {
                const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
                setNotifications(updatedNotifications);
            });
        }
    }, []);

    const getIconForType = (type: Notification['type']) => {
        switch(type) {
            case 'offer': return StarIcon;
            case 'feature': return SwatchIcon;
            default: return BellIcon;
        }
    };

    return (
        <div>
            <PageHeader title={t('notifications.title')} onBack={goBack} />
            <div className="p-4 space-y-3">
                {notifications.length > 0 ? (
                    notifications.map(n => {
                        const Icon = getIconForType(n.type);
                        return (
                             <div key={n.id} className="flex items-start gap-4 bg-card border border-border p-4 rounded-lg">
                                <Icon className="w-6 h-6 mt-1 text-accent flex-shrink-0"/>
                                <div>
                                    <p className="font-bold">{t(n.title)}</p>
                                    <p className="text-sm text-muted-foreground">{t(n.message)}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-20">
                         <p className="font-semibold text-lg text-foreground">{t('notifications.empty_title')}</p>
                        <p className="text-muted-foreground">{t('notifications.empty_subtitle')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export const NotificationSettingsPage: React.FC<{ preferences: NotificationPreferences; onPreferencesChange: (prefs: NotificationPreferences) => void; goBack: () => void; }> = ({ preferences, onPreferencesChange, goBack }) => {
    const { t } = useTranslation();

    const handleToggle = (key: keyof NotificationPreferences) => {
        onPreferencesChange({ ...preferences, [key]: !preferences[key] });
    };

    return (
        <div>
            <PageHeader title={t('notification_settings.title')} onBack={goBack} />
            <div className="p-4 space-y-4">
                <p className="text-muted-foreground text-sm px-2">{t('notification_settings.description')}</p>
                <div className="bg-card border border-border rounded-lg p-4 space-y-4 divide-y divide-border">
                    <ToggleSwitch label={t('notification_settings.promotions')} enabled={preferences.promotions} onChange={() => handleToggle('promotions')} />
                    <ToggleSwitch label={t('notification_settings.feature_updates')} enabled={preferences.featureUpdates} onChange={() => handleToggle('featureUpdates')} />
                    <ToggleSwitch label={t('notification_settings.general_alerts')} enabled={preferences.generalAlerts} onChange={() => handleToggle('generalAlerts')} />
                </div>
            </div>
        </div>
    );
};