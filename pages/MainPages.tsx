
import React, { useState } from 'react';
import { useTranslation } from '../contexts';
import type { Tool, User, Page, Generation, Notification } from '../types';
import { supabase } from '../lib/supabaseClient';
import { SettingsIcon, SparklesIcon, ClockIcon, BellIcon, CreditIcon, UserCircleIcon, ArrowRightOnRectangleIcon, StarIcon } from '../components/icons';
import { Button, Modal, PageHeader } from '../components/ui/Elements';
import { SettingsListItem } from './SettingsPages';

export const HomePage: React.FC<{tools: Tool[], recentGenerations: Generation[], selectTool: (tool: Tool) => void, user: User, onNavigate: (page: Page) => void}> = ({ tools, recentGenerations, selectTool, user, onNavigate }) => {
    const { t } = useTranslation();
    return (
    <div className="pt-6">
         <div className="p-4 flex justify-between items-center">
            <div>
                <p className="text-muted-foreground">{t('home.welcome_back')}</p>
                <h1 className="text-2xl font-bold">{user.username}</h1>
            </div>
            <button onClick={() => onNavigate('settings')}><SettingsIcon className="w-6 h-6 text-muted-foreground"/></button>
        </div>
        
        <div className="mt-4">
            <h2 className="text-lg font-semibold mb-3 px-4 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-accent"/>{t('home.popular_tools')}</h2>
            <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4 scrollbar-hide">
                {tools.slice(0, 5).map(tool => (
                    <div key={tool.id} onClick={() => selectTool(tool)} className="flex-shrink-0 w-32 h-40 rounded-2xl bg-cover bg-center relative overflow-hidden cursor-pointer group bg-card border border-border">
                        {tool.coverImage && <img src={tool.coverImage} alt={t(tool.name)} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"/>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <span className="absolute bottom-3 start-3 text-white font-bold text-sm leading-tight">{t(tool.name)}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="px-4 mt-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-accent"/>{t('home.recent_history')}</h2>
            <div className="grid grid-cols-2 gap-4">
                {recentGenerations.slice(0, 4).map(gen => (
                     <div key={gen.id} className="rounded-2xl bg-card aspect-square bg-cover bg-center border border-border" style={{backgroundImage: `url(${gen.imageUrl})`}}></div>
                ))}
            </div>
        </div>
    </div>
    );
};

export const ToolsPage: React.FC<{tools: Tool[], selectTool: (tool: Tool) => void, onNavigate: (page: Page) => void}> = ({ tools, selectTool, onNavigate }) => {
    const { t } = useTranslation();
    return (
    <div>
        <PageHeader title={t('tools.title')} showBack={false}>
            <button onClick={() => onNavigate('settings')}><SettingsIcon className="w-6 h-6 text-muted-foreground"/></button>
        </PageHeader>
        <div className="p-4 grid grid-cols-3 gap-4">
            {tools.map(tool => (
                <div key={tool.id} onClick={() => selectTool(tool)} className="bg-card rounded-2xl p-3 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-muted transition-all duration-200 border border-border hover:scale-105">
                    <tool.icon className="w-8 h-8 mb-2 text-accent" />
                    <p className="font-semibold text-sm text-center">{t(tool.name)}</p>
                </div>
            ))}
        </div>
    </div>
    );
};

export const HistoryPage: React.FC<{generations: Generation[]}> = ({ generations }) => {
    const { t } = useTranslation();
    
    const groupedByDate = generations.reduce((acc, gen) => {
        const date = new Date(gen.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(gen);
        return acc;
    }, {} as Record<string, Generation[]>);

    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });


    return (
        <div>
            <PageHeader title={t('history.title')} showBack={false} />
            <div className="p-4">
                {Object.entries(groupedByDate).map(([dateStr, gens]) => {
                    let title = dateStr;
                    if (dateStr === today) title = t('history.today');
                    if (dateStr === yesterdayStr) title = t('history.yesterday');
                    
                    return (
                        <div key={dateStr}>
                             <h3 className="font-bold text-lg my-4 pt-4 first:pt-0">{title}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {gens.map(gen => (
                                     <div key={gen.id} className="bg-card/80 rounded-2xl p-2 flex flex-col border border-border hover:bg-muted transition-colors cursor-pointer">
                                        <img src={gen.imageUrl} alt={t(gen.toolName)} className="w-full h-32 object-cover rounded-lg mb-2" />
                                        <p className="font-semibold text-sm mt-auto">{t(gen.toolName)}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(gen.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export const ProfilePage: React.FC<{user: User, notifications: Notification[], onNavigate: (page: Page) => void}> = ({ user, notifications, onNavigate }) => {
    const { t } = useTranslation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
    <div className="p-4">
        <PageHeader title={t('profile.title')} showBack={false}>
             <button onClick={() => onNavigate('notifications')} className="relative">
                <BellIcon className="w-6 h-6 text-muted-foreground"/>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
            </button>
        </PageHeader>
        <div className="text-center py-6">
            <div className="relative w-28 h-28 mx-auto">
                <img src="https://i.imgur.com/kQjLS8a.jpeg" alt="Profile" className="w-28 h-28 rounded-full object-cover"/>
                <button className="absolute bottom-0 end-0 bg-accent w-8 h-8 rounded-full flex items-center justify-center border-4 border-background">
                    <svg className="w-4 h-4 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                </button>
            </div>
            <h2 className="text-2xl font-bold mt-4">{user.username}</h2>
            {/* FIX: Use user.email property which now exists on the User type. */}
            <p className="text-muted-foreground">{user.email}</p>
        </div>
        
        <div className="bg-gradient-to-br from-accent/80 to-accent rounded-2xl p-5 flex items-center justify-between mb-6 text-accent-foreground shadow-lg shadow-accent/20">
            <div className="flex items-center">
                <CreditIcon className="w-8 h-8 me-4"/>
                <div>
                    <h4 className="font-bold text-lg">{user.credits} {t('profile.credits_remaining')}</h4>
                    <p className="opacity-80 text-sm">{t('profile.plan_type', { planName: user.plan.name })}</p>
                </div>
            </div>
            <button onClick={() => onNavigate('subscription')} className="bg-accent-foreground text-accent font-bold py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity">{t('subscription.upgrade_button')}</button>
        </div>

        <div className="space-y-2">
            <h3 className="text-muted-foreground/50 font-semibold uppercase text-sm px-2 pt-4">{t('profile.account_section')}</h3>
            <SettingsListItem title={t('profile.account_info_title')} subtitle={t('profile.account_info_subtitle')} onClick={() => onNavigate('account-info')} icon={UserCircleIcon} />
            <h3 className="text-muted-foreground/50 font-semibold uppercase text-sm px-2 pt-4">{t('profile.settings_section')}</h3>
            <SettingsListItem title={t('profile.notifications_title')} subtitle={t('profile.notifications_subtitle')} onClick={() => onNavigate('notification-settings')} icon={BellIcon} />
            <SettingsListItem title={t('settings.title')} subtitle={t('profile.general_settings_subtitle')} onClick={() => onNavigate('settings')} icon={SettingsIcon} />
        </div>
        <div className="mt-8">
            <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center justify-center gap-3 text-center bg-card text-red-400 font-semibold py-3 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors border border-border">
                <ArrowRightOnRectangleIcon className="w-5 h-5"/>
                <span>{t('profile.logout')}</span>
            </button>
        </div>
         {showLogoutModal && (
                <Modal title={t('logout_modal.title')} onClose={() => setShowLogoutModal(false)}>
                    <div className="text-center">
                        <p className="text-lg text-muted-foreground mb-4">{t('logout_modal.text')}</p>
                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm mb-6">
                            <p className="font-semibold text-accent flex items-center justify-center gap-2"><StarIcon className="w-5 h-5"/>{t('logout_modal.feature_prompt')}</p>
                            <p className="text-muted-foreground mt-1">{t('logout_modal.feature_name')}</p>
                        </div>
                        <div className="flex flex-col space-y-3">
                            <Button className="w-full !py-3" onClick={() => setShowLogoutModal(false)}>{t('logout_modal.stay_button')}</Button>
                            <button className="w-full text-muted-foreground font-semibold py-3 hover:text-foreground" onClick={handleLogout}>{t('logout_modal.logout_button')}</button>
                        </div>
                    </div>
                </Modal>
            )}
    </div>
    );
};
