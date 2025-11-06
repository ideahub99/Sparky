import React, { useState, useEffect, useMemo } from 'react';
// FIX: Import the 'Generation' type to be used in the UsageDetailPage component props.
import type { Page, User, Plan, Notification, NotificationPreferences, CreditUsage, Tool, Language, Generation } from '../types';
import { useTranslation, useTheme, ACCENT_COLORS } from '../contexts';
import type { Theme, AccentColor } from '../contexts';
// FIX: Added LineChart import for the new UsageDetailPage component.
import { PageHeader, Button, ToggleSwitch, LineChart, CircularProgress } from '../components/ui/Elements';
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
    CheckCircleIcon,
    HighFiveIcon,
    XMarkIcon,
    LogoIcon,
    MessageCodeIcon,
    ChevronDownIcon,
    CheckIcon,
} from '../components/icons';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { TOOL_COLORS } from '../constants/tools';

const SettingsListItem: React.FC<{
    title: string;
    icon: React.ComponentType<{className?: string}>;
    onClick: () => void;
}> = ({ title, icon: Icon, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center text-left p-4 bg-card rounded-lg hover:bg-muted transition-colors border border-border">
        <Icon className="w-6 h-6 me-4 text-accent" />
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

const ImmersiveTextPage: React.FC<{ title: string; children: React.ReactNode; goBack: () => void }> = ({ title, children, goBack }) => (
    <div className="fixed inset-0 bg-background overflow-hidden z-20">
        <div className="dark-glow-1"></div>
        <div className="dark-glow-2"></div>
        <div className="relative z-10 h-full flex flex-col">
            <PageHeader title={title} onBack={goBack} />
            <main className="flex-grow overflow-y-auto scrollbar-hide p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl p-6">
                    {children}
                </div>
            </main>
            <footer className="p-4 flex justify-center">
                <button onClick={goBack} className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-2xl transition-transform hover:scale-105">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </footer>
        </div>
    </div>
);


export const AboutPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; }> = ({ goBack }) => {
    const { t } = useTranslation();
    return (
        <ImmersiveTextPage title={t('about.title')} goBack={goBack}>
            <p>{t('about.p1')}</p>
            <p>{t('about.p2')}</p>
        </ImmersiveTextPage>
    );
};
export const PrivacyPolicyPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; }> = ({ goBack }) => {
    const { t } = useTranslation();
    return (
        <ImmersiveTextPage title={t('privacy.title')} goBack={goBack}>
            <p>{t('privacy.p1')}</p>
            <p>{t('privacy.p2')}</p>
            <p>{t('privacy.p3')}</p>
        </ImmersiveTextPage>
    );
};
export const TermsAndConditionsPage: React.FC<{ goBack: () => void; onNavigate: (page: Page) => void; }> = ({ goBack }) => {
    const { t } = useTranslation();
    return (
        <ImmersiveTextPage title={t('terms.title')} goBack={goBack}>
            <p>{t('terms.p1')}</p>
            <p>{t('terms.p2')}</p>
            <p>{t('terms.p3')}</p>
        </ImmersiveTextPage>
    );
};

export const LanguagePage: React.FC<{ goBack: () => void; }> = ({ goBack }) => {
    const { t, locale, setLocale } = useTranslation();
    return (
        <div>
            <PageHeader title={t('language.title')} onBack={goBack} />
            <div className="p-4 space-y-2">
                {SUPPORTED_LANGUAGES.map(lang => {
                    const isSelected = locale === lang.code;
                    return (
                        <button key={lang.code} onClick={() => setLocale(lang.code)} className={`w-full text-left p-4 rounded-lg font-semibold flex items-center justify-between transition-colors ${isSelected ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-muted'}`}>
                            <span>{t(lang.name)} <span className="text-current/70">({lang.nativeName})</span></span>
                            {isSelected && <CheckIcon className="w-5 h-5 text-accent-foreground"/>}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export const TrackingPage: React.FC<{ goBack: () => void; creditUsage: CreditUsage[]; allTools: Tool[], user: User | null, onSelectTool: (tool: Tool) => void }> = ({ goBack, user, creditUsage, allTools, onSelectTool }) => {
    const { t } = useTranslation();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = useMemo(() => {
        return creditUsage.filter(u => new Date(u.created_at) > thirtyDaysAgo);
    }, [creditUsage]);

    const today = new Date().toISOString().split('T')[0];
    const todaysUsage = useMemo(() => {
        return creditUsage.filter(u => u.created_at.startsWith(today))
                         .reduce((sum, u) => sum + u.credits, 0);
    }, [creditUsage, today]);

    const totalCreditsUsed = recentUsage.reduce((sum, u) => sum + u.credits, 0);
    const monthlyUsagePercent = user ? (totalCreditsUsed / (user.plan.monthly_credits || 1)) * 100 : 0;
    const creditsLeftPercent = user ? (user.credits / (user.plan.monthly_credits || 1)) * 100 : 0;
    const dailyUsagePercent = user ? (todaysUsage / (user.plan.max_daily_credits || 1)) * 100 : 0;
    
    const usageByTool = useMemo(() => {
        const usageMap = new Map<string, number>();
        recentUsage.forEach(usage => {
            usageMap.set(usage.toolName, (usageMap.get(usage.toolName) || 0) + usage.credits);
        });
        return Array.from(usageMap.entries())
            .map(([toolName, credits]) => ({
                toolName,
                credits,
                tool: allTools.find(t => t.name === toolName),
                percentage: totalCreditsUsed > 0 ? (credits / totalCreditsUsed) * 100 : 0,
            }))
            .sort((a, b) => b.credits - a.credits);
    }, [recentUsage, allTools, totalCreditsUsed]);

    return (
        <div className="flex flex-col h-full">
            <PageHeader title={t('tracking.title')} onBack={goBack} />
            <div className="p-4 space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <button className="flex items-center gap-1.5">
                        <h2 className="text-xl font-bold">{t('history.today')}, {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</h2>
                        <ChevronDownIcon className="w-4 h-4 text-muted-foreground mt-1" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center aspect-square">
                        <CircularProgress percentage={monthlyUsagePercent} color="#f97316" size={80} strokeWidth={8} />
                        <p className="mt-3 font-bold text-sm text-center">{t('tracking.monthly_usage')}</p>
                    </div>
                     <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center aspect-square">
                        <CircularProgress percentage={creditsLeftPercent} color="#22c55e" size={80} strokeWidth={8} />
                        <p className="mt-3 font-bold text-sm text-center">{t('tracking.credits_left')}</p>
                    </div>
                     <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center aspect-square">
                        <CircularProgress percentage={dailyUsagePercent} color="hsl(var(--accent))" size={80} strokeWidth={8} />
                        <p className="mt-3 font-bold text-sm text-center">{t('tracking.daily_limit')}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-3">{t('tracking.usage_breakdown')}</h3>
                    <div className="space-y-3">
                        {usageByTool.map(({ toolName, credits, tool, percentage }) => (
                            <button key={toolName} onClick={() => tool && onSelectTool(tool)} disabled={!tool} className="w-full flex items-center bg-card border border-border p-3 rounded-xl text-left hover:bg-muted transition-colors disabled:opacity-50">
                                {tool && <tool.icon className="w-8 h-8 me-4 p-1.5 rounded-md" style={{ backgroundColor: TOOL_COLORS[tool.id] || TOOL_COLORS.default, color: 'white' }} />}
                                <div className="flex-grow">
                                    <p className="font-semibold">{t(toolName)}</p>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                        <div className="bg-accent h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                                <p className="font-bold text-lg ms-3">{credits}</p>
                            </button>
                        ))}
                         {usageByTool.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-xl">
                                <p>{t('history.empty_subtitle')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// FIX: Added the missing UsageDetailPage component to resolve the import error.
export const UsageDetailPage: React.FC<{
    goBack: () => void;
    creditUsage: CreditUsage[];
    tool: Tool;
    recentGenerations: Generation[];
}> = ({ goBack, tool, creditUsage, recentGenerations }) => {
    const { t } = useTranslation();

    const toolUsage = useMemo(() => creditUsage.filter(u => u.toolName === tool.name), [creditUsage, tool.name]);
    const toolGenerations = useMemo(() => recentGenerations.filter(g => g.toolName === tool.name), [recentGenerations, tool.name]);
    
    const totalUsed = toolUsage.reduce((sum, u) => sum + u.credits, 0);

    // Group usage by date for chart over the last 30 days.
    const usageByDate = useMemo(() => {
        const dailyMap = new Map<string, number>();
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            dailyMap.set(dateString, 0);
        }
        toolUsage.forEach(u => {
            const dateString = new Date(u.created_at).toISOString().split('T')[0];
            if (dailyMap.has(dateString)) {
                dailyMap.set(dateString, dailyMap.get(dateString)! + u.credits);
            }
        });
        return Array.from(dailyMap.values());
    }, [toolUsage]);

    return (
        <div>
            <PageHeader title={`${t('tracking.details_title')} - ${t(tool.name)}`} onBack={goBack} />
            <div className="p-4 space-y-6">
                <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
                    <tool.icon className="w-12 h-12 p-2 rounded-lg" style={{ backgroundColor: TOOL_COLORS[tool.id] || TOOL_COLORS.default, color: 'white' }}/>
                    <div>
                        <p className="text-muted-foreground">{t('tracking.total_used')}</p>
                        <p className="text-3xl font-extrabold">{totalUsed}</p>
                    </div>
                </div>
                
                <div>
                    <h3 className="font-bold text-lg mb-2 px-1">{t('tracking.last_30_days')}</h3>
                    <div className="bg-card border border-border p-4 rounded-xl">
                        <LineChart data={usageByDate} />
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2 px-1">{t('tracking.recent_activity')}</h3>
                    {toolGenerations.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                             {toolGenerations.slice(0, 9).map(gen => (
                                <div key={gen.id} className="relative aspect-square bg-muted rounded-lg">
                                    {gen.imageUrl ? (
                                        <img src={gen.imageUrl} alt={t(gen.toolName)} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-1 text-center">
                                            <span className="text-xs text-muted-foreground">{t(gen.toolName)}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-xl">
                            <p>{t('history.empty_subtitle')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const SuccessScreen: React.FC<{ onFinish: () => void; message: string; }> = ({ onFinish, message }) => {
    const { t } = useTranslation();
    return (
        <div className="h-full flex flex-col items-center justify-between p-6 bg-background animate-fade-in-up">
            <div className="w-full max-w-sm mt-4">
                <div className="bg-green-500/10 text-green-400 text-sm font-semibold p-3 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>{message}</span>
                </div>
            </div>
            
            <div className="flex flex-col items-center text-center">
                <div className="w-40 h-40 bg-card border-4 border-border rounded-full flex items-center justify-center mb-8">
                    <HighFiveIcon className="w-24 h-24 text-accent" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">You're all good</h2>
                <p className="text-muted-foreground">Ready to keep going?</p>
            </div>
            
            <div className="w-full max-w-sm">
                 <Button onClick={onFinish} className="w-full !py-4">Finish!</Button>
            </div>
        </div>
    );
};

const PasswordChangeVerificationScreen: React.FC<{
  email: string;
  onVerified: () => void;
}> = ({ email, onVerified }) => {
    const { t } = useTranslation();
    const [code, setCode] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => { inputsRef.current[0]?.focus(); }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        const value = element.value;
        if (!/^[0-9]*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !code[index] && inputsRef.current[index - 1]) {
            inputsRef.current[index - 1]?.focus();
        }
    };
    
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData('text');
        const pastedCode = pastedText.replace(/\D/g, '').slice(0, 6);
        if (pastedCode) {
            e.preventDefault();
            const newCode = pastedCode.split('').concat(new Array(6 - pastedCode.length).fill(''));
            setCode(newCode);
            const focusIndex = Math.min(pastedCode.length, 5);
            if (inputsRef.current[focusIndex]) {
                setTimeout(() => inputsRef.current[focusIndex]?.focus(), 0);
            }
        }
    };

    const handleVerify = async () => {
        const token = code.join('');
        if (token.length !== 6) {
            setError(t('signup.error_invalid_code'));
            return;
        }
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });

        if (error) {
            setError(error.message);
        } else {
            onVerified();
        }
        setLoading(false);
    };
    
    return (
        <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <div className="bg-card border border-border p-4 rounded-full mb-6">
                <MessageCodeIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{t('signup.verify_code_title')}</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">{t('signup.verify_code_subtitle', { email })}</p>

            <div className="flex justify-between bg-card border border-border rounded-xl p-2 w-full max-w-xs mb-4" dir="ltr">
                {code.map((_, index) => (
                    <React.Fragment key={index}>
                        <input
                            type="tel" inputMode="numeric" maxLength={1} value={code[index]}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            ref={el => { inputsRef.current[index] = el }}
                            className="w-12 h-14 text-center text-3xl font-mono text-foreground bg-transparent border-0 focus:ring-0"
                        />
                        {index < 5 && <div className="w-px h-8 my-auto bg-border/50" />}
                    </React.Fragment>
                ))}
            </div>

            {error && <p className="text-destructive text-sm my-4">{error}</p>}
            
            <div className="w-full max-w-sm">
                <Button onClick={handleVerify} isLoading={loading} className="w-full !py-4">{t('signup.verify_button')}</Button>
            </div>
        </div>
    );
};

const SecureUpdatePasswordScreen: React.FC<{
  onSuccess: (message: string) => void;
}> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
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

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            onSuccess(t('account.password_success'));
        }
    };
    
    return (
        <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
            <div className="bg-card border border-border p-4 rounded-full mb-6">
                <KeyIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Set a New Password</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">Your new password must be different from previously used passwords.</p>
            
            <form className="w-full max-w-sm space-y-4" onSubmit={handleUpdatePassword}>
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" 
                    placeholder={t('account.new_password')}
                    required 
                />
                 <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" 
                    placeholder={t('signup.confirm_password_label')}
                    required 
                />

                {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}

                <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>Update Password</Button>
            </form>
        </div>
    );
};


export const AccountInfoPage: React.FC<{ user: User; goBack: () => void; onUserUpdate: () => void; }> = ({ user, goBack, onUserUpdate }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState(user.username);
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [passwordFlowStep, setPasswordFlowStep] = useState<'idle' | 'verifying' | 'updating'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleUpdateUser = async () => {
        if (user.username === username) return;
        setUsernameLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error: authError } = await supabase.auth.updateUser({ data: { username } });
            if (authError) throw authError;

            const { error: publicError } = await supabase.from('users').update({ username }).eq('id', user.id);
            if (publicError) throw publicError;

            await onUserUpdate();

            setMessage(t('account.update_success'));
            setShowSuccess(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleInitiatePasswordChange = async () => {
        setPasswordChangeLoading(true);
        setError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(user.email);
        if (error) {
            setError(error.message);
        } else {
            setPasswordFlowStep('verifying');
        }
        setPasswordChangeLoading(false);
    };
    
    const handleFinishSuccess = () => {
        setShowSuccess(false);
        setMessage(null);
    };

    if (showSuccess && message) {
        return <SuccessScreen onFinish={handleFinishSuccess} message={message} />;
    }
    
    if (passwordFlowStep === 'verifying') {
        return (
            <div className="h-full flex flex-col">
                <PageHeader title={t('account.password_section')} onBack={() => setPasswordFlowStep('idle')} />
                <PasswordChangeVerificationScreen 
                    email={user.email} 
                    onVerified={() => setPasswordFlowStep('updating')} 
                />
            </div>
        );
    }
    
    if (passwordFlowStep === 'updating') {
        return (
            <div className="h-full flex flex-col">
                <PageHeader title={t('account.password_section')} onBack={() => setPasswordFlowStep('verifying')} />
                <SecureUpdatePasswordScreen
                    onSuccess={(msg) => {
                        setMessage(msg);
                        setShowSuccess(true);
                        setPasswordFlowStep('idle');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <PageHeader title={t('account.title')} onBack={goBack} />
            <div className="p-4 space-y-8 flex-grow overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                    <h3 className="font-bold text-lg px-1">{t('account.profile_section')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">{t('signup.name_label')}</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-card border border-border rounded-xl p-3 focus:ring-accent focus:border-accent" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">{t('login.email_label')}</label>
                            <input type="email" value={user.email} className="w-full bg-card border-border rounded-xl p-3 text-muted-foreground cursor-not-allowed" disabled />
                        </div>
                    </div>
                    <Button onClick={handleUpdateUser} isLoading={usernameLoading} disabled={username === user.username} className="w-full !py-3.5">
                        {t('account.save_changes')}
                    </Button>
                </div>

                <div className="border-b border-border"></div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg px-1">{t('account.password_section')}</h3>
                     <p className="text-muted-foreground text-sm px-1">{t('account.password_change_description')}</p>
                    <Button onClick={handleInitiatePasswordChange} isLoading={passwordChangeLoading} className="w-full !py-3.5">
                        {t('account.send_code_button')}
                    </Button>
                </div>
                {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
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
    }, [notifications, setNotifications]);

    const getIconForType = (type: Notification['type']) => {
        switch(type) {
            case 'offer': return StarIcon;
            case 'feature': return SwatchIcon;
            default: return BellIcon;
        }
    };
    
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    }

    return (
        <div className="fixed inset-0 bg-background overflow-hidden z-20">
            <div className="dark-glow-1"></div>
            <div className="dark-glow-2"></div>
            
            <div className="relative z-10 h-full flex flex-col">
                <header className="flex flex-col items-center px-4 pt-8 mb-6 flex-shrink-0">
                    <BellIcon className="w-12 h-12 text-muted-foreground/50 mb-4"/>
                    <button className="flex items-center gap-2 bg-card/60 backdrop-blur-md border border-border/50 rounded-full px-4 py-1.5 text-sm font-semibold">
                        <span>Welcome</span>
                        <InformationCircleIcon className="w-4 h-4 text-muted-foreground"/>
                    </button>
                </header>
                
                <main className="flex-grow overflow-y-auto scrollbar-hide px-4 space-y-4">
                    {notifications.length > 0 ? (
                        notifications.map((n, index) => {
                            const Icon = getIconForType(n.type);
                            return (
                                <div key={n.id} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="w-11 h-11 rounded-full bg-card border border-border flex-shrink-0 flex items-center justify-center">
                                         <Icon className="w-6 h-6 text-accent"/>
                                    </div>
                                    <div className="flex-grow bg-card/60 backdrop-blur-lg border border-border/50 rounded-2xl p-3 flex items-start gap-3">
                                        <div className="flex-grow">
                                            <p className="font-semibold leading-tight">{t(n.title)}</p>
                                            <p className="text-sm text-muted-foreground">{t(n.message)}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        <LogoIcon className="w-6 h-6 text-muted-foreground/50 flex-shrink-0" />
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                         <div className="flex flex-col items-center justify-center pt-10">
                            <div className="text-center text-muted-foreground bg-card/60 backdrop-blur-lg border border-border/50 rounded-3xl p-8 space-y-2">
                                <p className="font-semibold text-lg text-foreground">{t('notifications.empty_title')}</p>
                                <p>{t('notifications.empty_subtitle')}</p>
                            </div>
                        </div>
                    )}
                </main>
            
                <footer className="p-4 flex justify-center flex-shrink-0">
                    <button onClick={goBack} className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-2xl transition-transform hover:scale-105">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </footer>
            </div>
        </div>
    );
};


export const NotificationSettingsPage: React.FC<{ preferences: NotificationPreferences; onPreferencesChange: (prefs: NotificationPreferences) => void; goBack: () => void; }> = ({ preferences, onPreferencesChange, goBack }) => {
    const { t } = useTranslation();

    const handleToggle = (key: keyof NotificationPreferences) => {
        onPreferencesChange({ ...preferences, [key]: !preferences[key] });
    };

    const settings = [
        { key: 'promotions', label: t('notification_settings.promotions') },
        { key: 'featureUpdates', label: t('notification_settings.feature_updates') },
        { key: 'generalAlerts', label: t('notification_settings.general_alerts') },
    ];

    return (
        <div>
            <PageHeader title={t('notification_settings.title')} onBack={goBack} />
            <div className="p-4 space-y-4">
                <p className="text-muted-foreground text-sm px-2">{t('notification_settings.description')}</p>
                <div className="space-y-3">
                    {settings.map(setting => (
                         <div key={setting.key} className="bg-card border border-border rounded-lg p-4">
                             <ToggleSwitch 
                                label={setting.label} 
                                enabled={preferences[setting.key as keyof NotificationPreferences]} 
                                onChange={() => handleToggle(setting.key as keyof NotificationPreferences)} 
                            />
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};