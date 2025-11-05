import React from 'react';
import type { Page, User, Tool, Generation, Notification } from '../types';
import { useTranslation } from '../contexts';
import { PageHeader, Button } from '../components/ui/Elements';
import { SettingsIcon, BellIcon, ChevronRightIcon, UserCircleIcon, CreditIcon, ArrowRightOnRectangleIcon } from '../components/icons';
import { supabase } from '../lib/supabaseClient';

// --- HomePage ---
interface HomePageProps {
  user: User;
  tools: Tool[];
  recentGenerations: Generation[];
  selectTool: (tool: Tool) => void;
  onNavigate: (page: Page) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, tools, recentGenerations, selectTool, onNavigate }) => {
    const { t } = useTranslation();
    const popularTools = tools.slice(0, 4);

    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('home.welcome_back')}</h1>
                    <p className="text-muted-foreground">{user.username}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onNavigate('notifications')} className="relative p-2 rounded-full hover:bg-muted">
                        <BellIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={() => onNavigate('profile')} className="p-2 rounded-full hover:bg-muted">
                        <UserCircleIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>

            <div className="p-4 bg-card border border-border rounded-2xl flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">{t('profile.credits_remaining')}</p>
                    <p className="text-3xl font-extrabold text-accent">{user.credits}</p>
                </div>
                <Button onClick={() => onNavigate('subscription')}>{t('subscription.upgrade_button')}</Button>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">{t('home.popular_tools')}</h2>
                    <button onClick={() => onNavigate('tools')} className="text-sm font-semibold text-accent">{t('nav.tools')}</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {popularTools.map(tool => (
                        <button key={tool.id} onClick={() => selectTool(tool)} className="bg-card border border-border p-4 rounded-2xl text-left hover:bg-muted transition-colors">
                            <tool.icon className="w-8 h-8 mb-3 text-accent"/>
                            <h3 className="font-bold">{t(tool.name)}</h3>
                            <p className="text-sm text-muted-foreground">{t(tool.description)}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                 <h2 className="text-lg font-bold mb-3">{t('home.recent_history')}</h2>
                 {recentGenerations.length > 0 ? (
                     <div className="space-y-3">
                        {recentGenerations.slice(0,3).map(gen => (
                            <div key={gen.id} className="flex items-center gap-4 bg-card p-3 rounded-xl border border-border">
                                {gen.imageUrl && <img src={gen.imageUrl} alt="Generated" className="w-16 h-16 rounded-lg object-cover" />}
                                <div>
                                    <p className="font-semibold">{t(gen.toolName)}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(gen.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                 ) : (
                    <div className="text-center py-8">
                        <p className="font-semibold text-foreground">{t('history.empty_title')}</p>
                        <p className="text-muted-foreground text-sm">{t('history.empty_subtitle')}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};


// --- ToolsPage ---
interface ToolsPageProps {
  tools: Tool[];
  selectTool: (tool: Tool) => void;
  onNavigate: (page: Page) => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ tools, selectTool }) => {
    const { t } = useTranslation();

    return (
        <div>
            <PageHeader title={t('tools.title')} showBack={false} />
            <div className="p-4 grid grid-cols-2 gap-4">
                {tools.map(tool => (
                    <button key={tool.id} onClick={() => selectTool(tool)} className="bg-card border border-border p-4 rounded-2xl text-left hover:bg-muted transition-colors flex flex-col items-start aspect-square justify-between">
                        <div>
                            <tool.icon className="w-8 h-8 mb-3 text-accent"/>
                            <h3 className="font-bold">{t(tool.name)}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{t(tool.description)}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


// --- HistoryPage ---
interface HistoryPageProps {
  generations: Generation[];
}

const groupGenerationsByDate = (generations: Generation[], t: (key: string, replacements?: Record<string, string>) => string) => {
    const groups: { [key: string]: Generation[] } = {};
    generations.forEach(gen => {
        const date = new Date(gen.created_at);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key: string;
        if (date.toDateString() === today.toDateString()) {
            key = t('history.today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = t('history.yesterday');
        } else {
            key = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(gen);
    });
    return groups;
};

export const HistoryPage: React.FC<HistoryPageProps> = ({ generations }) => {
    const { t } = useTranslation();
    const groupedGenerations = groupGenerationsByDate(generations, t);

    return (
        <div>
            <PageHeader title={t('history.title')} showBack={false} />
            <div className="p-4">
                {generations.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="font-semibold text-lg text-foreground">{t('history.empty_title')}</p>
                        <p className="text-muted-foreground">{t('history.empty_subtitle')}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedGenerations).map(([date, gens]) => (
                            <div key={date}>
                                <h2 className="font-bold mb-3 px-2">{date}</h2>
                                <div className="grid grid-cols-3 gap-2">
                                    {gens.map(gen => (
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- ProfilePage ---
interface ProfilePageProps {
  user: User;
  notifications: Notification[];
  onNavigate: (page: Page, resetStack?: boolean) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, notifications, onNavigate }) => {
    const { t } = useTranslation();
    const unreadNotifications = notifications.filter(n => !n.read).length;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onNavigate('welcome', true);
    };

    return (
        <div>
            <PageHeader title={t('profile.title')} showBack={false}>
                <button onClick={() => onNavigate('settings')} className="p-2">
                    <SettingsIcon className="w-6 h-6"/>
                </button>
            </PageHeader>
            <div className="p-4 space-y-6">
                <div className="flex items-center gap-4">
                     <UserCircleIcon className="w-20 h-20 text-muted" />
                    <div>
                        <h2 className="text-xl font-bold">{user.username}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="p-4 bg-card border border-border rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">{t('profile.plan_type', { planName: user.plan.name })}</p>
                        <Button onClick={() => onNavigate('subscription')}>{t('subscription.upgrade_button')}</Button>
                    </div>
                    <div className="flex justify-between items-center">
                         <p className="text-sm text-muted-foreground">{t('profile.credits_remaining')}</p>
                         <p className="font-bold text-accent flex items-center gap-1.5">
                            <CreditIcon className="w-5 h-5"/>
                            <span>{user.credits}</span>
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold mb-2 px-2">{t('profile.account_section')}</h3>
                    <div className="space-y-1">
                        <ListItem 
                            title={t('profile.account_info_title')} 
                            subtitle={t('profile.account_info_subtitle')} 
                            icon={UserCircleIcon} 
                            onClick={() => onNavigate('account-info')} 
                        />
                        <ListItem 
                            title={t('profile.notifications_title')} 
                            subtitle={t('profile.notifications_subtitle')} 
                            icon={BellIcon} 
                            onClick={() => onNavigate('notifications')}
                            badge={unreadNotifications > 0 ? unreadNotifications : undefined}
                        />
                    </div>
                </div>

                 <div>
                    <h3 className="font-bold mb-2 px-2">{t('profile.settings_section')}</h3>
                    <div className="space-y-1">
                         <ListItem 
                            title={t('settings.title')} 
                            subtitle={t('profile.general_settings_subtitle')} 
                            icon={SettingsIcon} 
                            onClick={() => onNavigate('settings')} 
                        />
                    </div>
                </div>
                
                <div className="pt-4">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-destructive font-semibold p-3 bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-5 h-5"/>
                        <span>{t('profile.logout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper for ProfilePage list items
const ListItem: React.FC<{
    title: string;
    subtitle: string;
    icon: React.ComponentType<{className?: string}>;
    onClick: () => void;
    badge?: number;
}> = ({ title, subtitle, icon: Icon, onClick, badge }) => (
    <button onClick={onClick} className="w-full flex items-center text-left p-3 rounded-lg hover:bg-muted transition-colors">
        <Icon className="w-6 h-6 me-4 text-muted-foreground" />
        <div className="flex-grow">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {badge ? (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center me-2">{badge}</span>
        ) : null }
        <ChevronRightIcon className="w-5 h-5 text-muted-foreground rtl-flip" />
    </button>
);
