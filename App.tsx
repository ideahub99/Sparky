
import React, { useState, useCallback, useEffect } from 'react';
// FIX: Added missing type imports for Page, Tool, and Hairstyle.
import type { User, Plan, Page, Generation, CreditUsage, Notification, NotificationPreferences, Tool, Hairstyle } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { BottomNav } from './components/ui/Elements';
import { LocaleContext, ThemeContext, ACCENT_COLORS } from './contexts';
import type { Theme, AccentColor } from './contexts';

import { WelcomeScreen, LoginScreen, SignUpScreen } from './pages/AuthPages';
import { HomePage, ToolsPage, HistoryPage, ProfilePage } from './pages/MainPages';
// FIX: Corrected import for EditorPage which was previously causing a module resolution error.
import { EditorPage } from './pages/EditorPage';
import { 
    SettingsPage, 
    SubscriptionPage, 
    ThemesPage, 
    AboutPage, 
    PrivacyPolicyPage, 
    TermsAndConditionsPage, 
    LanguagePage,
    TrackingPage,
    AccountInfoPage,
    NotificationsPage,
    NotificationSettingsPage
} from './pages/SettingsPages';
import { translations } from './i18n';
import { SparklesIcon, FaceSmileIcon, PaintBrushIcon, ClockIcon, UserSearchIcon, HappyFaceIcon, SadFaceIcon, WindIcon, BeardIcon, SkinIcon, PumpkinIcon, EyeIcon } from './components/icons';
import { DEFAULT_NOTIFICATION_PREFERENCES, PLAN_FREE } from './constants/plans';

const SupabaseConfigError: React.FC = () => (
    <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
            <h1 className="text-2xl font-bold mb-4 text-destructive">Configuration Error</h1>
            <p className="text-muted-foreground">The application cannot connect to the backend.</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                The Supabase URL and Key have not been set. Please ensure the
                <code> SUPABASE_URL </code> and <code> SUPABASE_ANON_KEY </code> environment variables
                are correctly configured for this project to function.
            </p>
        </div>
    </div>
);


const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [navigationStack, setNavigationStack] = useState<Page[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Data states
  const [tools, setTools] = useState<Tool[]>([]);
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [creditUsage, setCreditUsage] = useState<CreditUsage[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const defaultLocale = 'en';
  const [locale, setLocale] = useState(defaultLocale);
  const [theme, setTheme] = useState<Theme>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>(ACCENT_COLORS[0]);

  const fetchUserProfile = async (sessionUser: any): Promise<User | null> => {
        const { data: userProfileData, error } = await supabase
            .from('users')
            .select('*, plans(*)')
            .eq('id', sessionUser.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user profile:', error.message);
            return null;
        }
        if (!userProfileData) return null;

        const userProfile = {
            ...userProfileData,
            email: sessionUser.email, // Get email from the auth user object
            plan: userProfileData.plans || PLAN_FREE,
            notificationPreferences: userProfileData.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
        };
        delete (userProfile as any).plans;
        delete (userProfile as any).notification_preferences;

        return userProfile as User;
    };

  // Supabase Auth Effect - Manages user state
  useEffect(() => {
    if (!isSupabaseConfigured) {
        setAuthLoading(false);
        return;
    }

    const handleAuthChange = async (session: any) => {
        if (session) {
            const profile = await fetchUserProfile(session.user);
            setUser(profile);
        } else {
            setUser(null);
        }
        setAuthLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange(session);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        // Only refetch profile if the user ID changes or user logs out.
        // This prevents re-fetching on token refreshes.
        if (session?.user?.id !== user?.id || !session) {
             handleAuthChange(session);
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, [user?.id]); // Depend on user.id to avoid re-running on token refresh
  
  // Navigation Effect - Reacts to user state changes
  useEffect(() => {
    if (!authLoading) {
      const isUserOnAuthPage = ['welcome', 'login', 'signup'].includes(page);
      const isUserOnAppPage = !isUserOnAuthPage;

      if (user && isUserOnAuthPage) {
        navigate('home', true);
      } else if (!user && isUserOnAppPage) {
        navigate('welcome', true);
      }
    }
  }, [user, authLoading, page]);


  const refreshData = useCallback(async (userId: string) => {
      setDataLoading(true);
      const [
          userProfileRes,
          generationsRes,
          notificationsRes,
          creditUsageRes
      ] = await Promise.all([
          supabase.from('users').select('*, plans(*)').eq('id', userId).maybeSingle(),
          supabase.from('generations').select('id, tool_id, image_url, created_at, tools(name_key)').order('created_at', { ascending: false }).limit(20),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('credit_usage').select('id, tool_id, credits_used, created_at, tools(name_key)').order('created_at', { ascending: false }).limit(200)
      ]);

      if (userProfileRes.data) {
          const sessionUser = (await supabase.auth.getUser()).data.user;
          const userProfile = {
              ...userProfileRes.data,
              email: sessionUser?.email,
              plan: userProfileRes.data.plans || PLAN_FREE,
              notificationPreferences: userProfileRes.data.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
          };
          delete (userProfile as any).plans;
          delete (userProfile as any).notification_preferences;
          setUser(userProfile as User);
      }

      if (generationsRes.data) setGenerations(generationsRes.data.map((g: any) => ({...g, toolName: g.tools.name_key, imageUrl: g.image_url })) as Generation[]);
      if (notificationsRes.data) setNotifications(notificationsRes.data as Notification[]);
      if (creditUsageRes.data) setCreditUsage(creditUsageRes.data.map((c: any) => ({...c, toolName: c.tools.name_key, credits: c.credits_used, date: c.created_at.split('T')[0] })) as CreditUsage[]);
      
      setDataLoading(false);
  }, [setUser, setGenerations, setNotifications, setCreditUsage]);

  // Data Fetching Effect
  useEffect(() => {
    if (user && isSupabaseConfigured) {
        const fetchInitialData = async () => {
            setDataLoading(true);
            
            const mapToolIcons = (dbTools: any[]) => {
                // FIX: Update icon map type to allow style prop, resolving type error in TrackingPage
                const iconMap: { [key: string]: React.ComponentType<{ className?: string; style?: React.CSSProperties }> } = {
                    SparklesIcon, FaceSmileIcon, PaintBrushIcon, ClockIcon, UserSearchIcon, HappyFaceIcon, SadFaceIcon, WindIcon, BeardIcon, SkinIcon, PumpkinIcon, EyeIcon
                };
                return dbTools.map(t => ({...t, icon: iconMap[t.icon_name] || SparklesIcon, name: t.name_key, description: t.description_key }));
            }

            const [
                toolsRes, 
                hairstylesRes, 
                generationsRes, 
                notificationsRes, 
                creditUsageRes,
                plansRes
            ] = await Promise.all([
                supabase.from('tools').select('*').eq('is_active', true).order('sort_order'),
                supabase.from('hairstyles').select('*'),
                supabase.from('generations').select('id, tool_id, image_url, created_at, tools(name_key)').order('created_at', { ascending: false }).limit(20),
                supabase.from('notifications').select('*').order('created_at', { ascending: false }),
                supabase.from('credit_usage').select('id, tool_id, credits_used, created_at, tools(name_key)').order('created_at', { ascending: false }).limit(200),
                supabase.from('plans').select('*').order('id')
            ]);
            
            if (toolsRes.data) setTools(mapToolIcons(toolsRes.data));
            if (hairstylesRes.data) setHairstyles(hairstylesRes.data.map((h: any) => ({ ...h, imageUrl: h.image_url, isPro: h.is_pro })) as Hairstyle[]);
            if (generationsRes.data) setGenerations(generationsRes.data.map((g: any) => ({...g, toolName: g.tools.name_key, imageUrl: g.image_url })) as Generation[]);
            if (notificationsRes.data) setNotifications(notificationsRes.data as Notification[]);
            if (creditUsageRes.data) setCreditUsage(creditUsageRes.data.map((c: any) => ({...c, toolName: c.tools.name_key, credits: c.credits_used, date: c.created_at.split('T')[0] })) as CreditUsage[]);
            if (plansRes.data) setPlans(plansRes.data as Plan[]);
            
            setDataLoading(false);
        };
        fetchInitialData();
    }
  }, [user?.id, isSupabaseConfigured]);


  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor.value);
    document.documentElement.style.setProperty('--ring', accentColor.value);
  }, [accentColor]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    let effectiveTheme = theme;
    if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.classList.add(effectiveTheme);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
        if (theme === "system") {
            const newColorScheme = mediaQuery.matches ? "dark" : "light";
            root.classList.remove("light", "dark");
            root.classList.add(newColorScheme);
        }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);


  useEffect(() => {
    document.body.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: string, replacements: Record<string, string> = {}): string => {
    const translationSet = translations[locale] || translations[defaultLocale];
    let translated = translationSet?.[key] || key;
    Object.keys(replacements).forEach(placeholder => {
        translated = translated.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return translated;
  }, [locale]);
  
  const navigate = (newPage: Page, resetStack = false) => {
    if (newPage === page) return;
    if (!resetStack) {
      setNavigationStack([...navigationStack, page]);
    } else {
      setNavigationStack([]);
    }
    setPage(newPage);
  };

  const goBack = () => {
    const lastPage = navigationStack.pop();
    if (lastPage) {
      setNavigationStack([...navigationStack]);
      setPage(lastPage);
    } else {
      if (['editor', 'settings', 'subscription', 'themes', 'about', 'privacy', 'terms', 'language', 'tracking', 'account-info', 'notifications', 'notification-settings'].includes(page)) {
        navigate('home');
      }
    }
  };
   
  const selectTool = (tool: Tool) => {
    setActiveTool(tool);
    navigate('editor');
  };

  const renderPage = () => {
    // FIX: The page loader should not display on the editor page, as it causes the component to unmount and lose state.
    const showPageLoader = (authLoading || (user && dataLoading)) && page !== 'editor';
    if (showPageLoader) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!user) {
      switch (page) {
        case 'login':
          return <LoginScreen onNavigate={navigate} />;
        case 'signup':
          return <SignUpScreen onNavigate={navigate} />;
        case 'welcome':
        default:
          return <WelcomeScreen onNavigate={navigate} />;
      }
    }
    
    switch (page) {
      case 'tools':
        return <ToolsPage tools={tools} selectTool={selectTool} onNavigate={navigate} />;
      case 'history':
        return <HistoryPage generations={generations} />;
      case 'profile':
        return <ProfilePage user={user} notifications={notifications} onNavigate={navigate} />;
      case 'settings':
        return <SettingsPage onNavigate={navigate} goBack={goBack} />;
      case 'subscription':
        return <SubscriptionPage goBack={goBack} onNavigate={navigate} user={user} plans={plans} />;
      case 'themes':
        return <ThemesPage goBack={goBack} />;
      case 'about':
        return <AboutPage goBack={goBack} onNavigate={navigate} />;
      case 'privacy':
        return <PrivacyPolicyPage goBack={goBack} onNavigate={navigate} />;
      case 'terms':
        return <TermsAndConditionsPage goBack={goBack} onNavigate={navigate} />;
      case 'language':
          return <LanguagePage goBack={goBack} />;
      case 'tracking':
          return <TrackingPage goBack={goBack} creditUsage={creditUsage} allTools={tools}/>;
      case 'account-info':
        return <AccountInfoPage user={user} goBack={goBack} onUserUpdate={() => refreshData(user.id)} />;
      case 'notifications':
        return <NotificationsPage notifications={notifications} setNotifications={setNotifications} goBack={goBack} />;
      case 'notification-settings':
        const handlePreferencesChange = async (prefs: NotificationPreferences) => {
            if (user) {
                const { data, error } = await supabase.from('users').update({ notification_preferences: prefs }).eq('id', user.id);
                if (!error) {
                    setUser({ ...user, notificationPreferences: prefs });
                }
            }
        };
        return <NotificationSettingsPage preferences={user.notificationPreferences} onPreferencesChange={handlePreferencesChange} goBack={goBack} />;
      case 'editor':
        return activeTool ? <EditorPage activeTool={activeTool} goBack={goBack} user={user} onNavigate={navigate} onDataRefresh={() => refreshData(user.id)} hairstyles={hairstyles}/> : <ToolsPage tools={tools} selectTool={selectTool} onNavigate={navigate} />;
      case 'home':
      default:
        return <HomePage tools={tools} recentGenerations={generations} selectTool={selectTool} user={user} onNavigate={navigate} />;
    }
  };

  const showBottomNav = user && ['home', 'tools', 'history', 'profile'].includes(page);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
        <div className="max-w-md mx-auto min-h-[100dvh] bg-background flex flex-col font-sans">
        <div className={`flex-grow ${showBottomNav ? 'pb-24' : ''}`}> 
            {isSupabaseConfigured ? renderPage() : <SupabaseConfigError />}
        </div>
        {isSupabaseConfigured && showBottomNav && <BottomNav activePage={page} setPage={(p: Page) => navigate(p, true)} />}
        </div>
      </ThemeContext.Provider>
    </LocaleContext.Provider>
  );
};

export default App;
