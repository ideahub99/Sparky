

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../contexts';
import type { Page } from '../types';
import { Button, PageHeader } from '../components/ui/Elements';
import { supabase } from '../lib/supabaseClient';
import { LogoIcon, SparklesIcon, UserSearchIcon, ClockIcon, PaintBrushIcon } from '../components/icons';

// FIX: Added WelcomeScreen component which was missing.
export const WelcomeScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [typedTitle, setTypedTitle] = useState('');
    const [showTitleCursor, setShowTitleCursor] = useState(true);
    const title = t("welcome.title");

    const phrases = useMemo(() => [
        t('welcome.phrase1'),
        t('welcome.phrase2'),
        t('welcome.phrase3'),
    ], [t]);

    const [phraseIndex, setPhraseIndex] = useState(0);
    const [currentPhrase, setCurrentPhrase] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        // Ensure state is reset if component re-renders without unmounting (e.g., hot reload)
        setTypedTitle('');
        setShowTitleCursor(true);
        
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < title.length) {
                setTypedTitle(prev => prev + title.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
                // Hide cursor after typing is complete
                setTimeout(() => setShowTitleCursor(false), 700);
            }
        }, 150);

        return () => {
            clearInterval(typingInterval);
        };
    }, [title]);
    
    // Effect for subtitle typing animation
    useEffect(() => {
        if (typedTitle.length !== title.length) return; // Wait for title animation to finish

        const handleTyping = () => {
            const fullPhrase = phrases[phraseIndex];
            if (isDeleting) {
                setCurrentPhrase(fullPhrase.substring(0, currentPhrase.length - 1));
                setTypingSpeed(75);
            } else {
                setCurrentPhrase(fullPhrase.substring(0, currentPhrase.length + 1));
                setTypingSpeed(150);
            }

            if (!isDeleting && currentPhrase === fullPhrase) {
                setTimeout(() => setIsDeleting(true), 1500); // Pause at end of phrase
            } else if (isDeleting && currentPhrase === '') {
                setIsDeleting(false);
                setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
            }
        };

        const typingTimeout = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(typingTimeout);
    }, [currentPhrase, isDeleting, phraseIndex, phrases, typedTitle.length, title.length, typingSpeed]);

    const animationsReady = typedTitle.length === title.length;
    
    const buttonDelay = (title.length * 150 + 500) / 1000;
    
    const features = useMemo(() => [
        { icon: SparklesIcon, text: t('welcome.feature1'), delay: buttonDelay + 0.3 },
        { icon: UserSearchIcon, text: t('welcome.feature2'), delay: buttonDelay + 0.4 },
        { icon: ClockIcon, text: t('welcome.feature3'), delay: buttonDelay + 0.5 },
        { icon: PaintBrushIcon, text: t('welcome.feature4'), delay: buttonDelay + 0.6 }
    ], [t, buttonDelay]);

    return (
        <div className="min-h-full flex flex-col justify-center items-center py-8 px-4 text-center text-foreground relative overflow-hidden animated-gradient-background">
            <div className="relative z-10 w-full max-w-xs sm:max-w-sm">
                 <h1 className="text-5xl font-bold mb-4 text-accent min-h-[60px] flex items-center justify-center gap-2">
                    {animationsReady && <LogoIcon className="w-12 h-12 animate-flame" />}
                    <span>{typedTitle}</span>
                    {showTitleCursor && <span className="inline-block w-1.5 h-12 bg-accent blinking-cursor ml-2"></span>}
                </h1>
                
                <p className="text-muted-foreground mb-12 max-w-sm mx-auto min-h-[48px] text-lg">
                    {animationsReady && (
                        <>
                            <span>{currentPhrase}</span>
                            <span className="inline-block w-0.5 h-6 bg-muted-foreground blinking-cursor ml-1"></span>
                        </>
                    )}
                </p>

                <div 
                  className="w-full space-y-3 animate-fade-in-up" 
                  style={animationsReady ? { animationDelay: `${buttonDelay}s`, animationFillMode: 'backwards' } : { opacity: 0 }}
                >
                    <Button className="w-full !py-4" onClick={() => onNavigate('signup')}>{t('welcome.create_account')}</Button>
                    <button className="w-full font-semibold py-3 text-accent hover:text-accent/80" onClick={() => onNavigate('login')}>{t('welcome.log_in')}</button>
                </div>

                <div className="mt-16 grid grid-cols-2 gap-4 w-full">
                    {features.map((feature, index) => (
                        <div 
                            key={index}
                            className="bg-card/20 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center aspect-square animate-card-entry transition-all duration-300 hover:scale-105 hover:bg-card/40 hover:border-white/20"
                            style={animationsReady ? { animationDelay: `${feature.delay}s`, animationFillMode: 'backwards' } : { opacity: 0 }}
                        >
                            <feature.icon className="w-7 h-7 mb-3 text-accent" />
                            <span className="text-sm font-medium text-foreground/80 leading-tight">{feature.text}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};


export const LoginScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // After successful authentication, we must verify that a corresponding user profile exists in our public `users` table.
            // This prevents users from getting stuck in a logged-in state without a profile, which can happen if the
            // post-signup trigger fails or if a user was created before the trigger existed.
            const { error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', authData.user.id)
                .single(); // .single() is crucial here; it errors if no row (or more than one) is found.

            if (profileError) {
                // If the profile doesn't exist, we inform the user and log them out to clear the invalid session.
                setError("Login failed: User profile not found. Please contact support.");
                await supabase.auth.signOut();
                setLoading(false);
            }
            // If the profile exists, we do nothing here. The global onAuthStateChange listener in App.tsx
            // will detect the new session, fetch the full user profile, update the global state, and trigger navigation.
            // We intentionally don't set loading to false, so the user sees a spinner until they are navigated away.
        } else {
            // This case handles unexpected scenarios where login succeeds without returning a user object.
            setError("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError("Please enter your email address to reset your password.");
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // URL to redirect to after password reset
        });
        if (error) {
            setError(error.message);
        } else {
            setMessage("Password reset link sent! Please check your email.");
        }
        setLoading(false);
    };

    return (
    <div className="h-full flex flex-col justify-center p-8 text-foreground">
        <PageHeader title="" showBack={true} onBack={() => onNavigate('welcome')} />
        <div className="text-center mb-10">
            {/* ... (icon and title) ... */}
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
            <div>
                <label className="text-sm font-medium text-muted-foreground">{t('login.email_label')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" required />
            </div>
            <div>
                 <div className="flex justify-between items-baseline">
                    <label className="text-sm font-medium text-muted-foreground">{t('login.password_label')}</label>
                    <button type="button" onClick={handlePasswordReset} className="text-xs font-semibold text-accent hover:text-accent/80">Forgot Password?</button>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" required />
            </div>
            {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
            {message && <p className="text-green-500 text-sm text-center pt-2">{message}</p>}
            <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>{t('login.submit_button')}</Button>
        </form>
        <p className="text-center text-muted-foreground mt-8">
            {t('login.signup_prompt')} <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="font-semibold text-accent hover:text-accent/80">{t('login.signup_link')}</a>
        </p>
    </div>
    );
};

const VerificationCodeScreen: React.FC<{ email: string; }> = ({ email }) => {
    const { t } = useTranslation();
    const [code, setCode] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (!/^[0-9]*$/.test(element.value)) return;

        const newCode = [...code];
        newCode[index] = element.value;
        setCode(newCode);

        // Focus next input
        if (element.nextSibling && element.value) {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !code[index] && inputsRef.current[index - 1]) {
            inputsRef.current[index - 1]?.focus();
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
        setMessage(null);
        
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (error) {
            setError(error.message);
        }
        // On success, the user state will change, and App.tsx's useEffect will navigate to 'home'.
        setLoading(false);
    };
    
    const handleResend = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        if (error) {
            setError(error.message);
        } else {
            setMessage(t('signup.resend_success'));
        }
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col justify-center items-center p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t('signup.verify_code_title')}</h2>
            <p className="text-muted-foreground mb-8">{t('signup.verify_code_subtitle', { email })}</p>

            <div className="flex justify-center gap-2 mb-4" dir="ltr">
                {code.map((data, index) => (
                    <input
                        key={index}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={data}
                        onChange={(e) => handleChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        // FIX: The ref callback for an input element should not return a value. Wrapping the assignment in curly braces fixes the TypeScript error.
                        ref={el => { inputsRef.current[index] = el }}
                        className="w-12 h-14 text-center text-2xl font-bold bg-card border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                    />
                ))}
            </div>

            {error && <p className="text-destructive text-sm my-4">{error}</p>}
            {message && <p className="text-green-500 text-sm my-4">{message}</p>}
            
            <Button onClick={handleVerify} isLoading={loading} className="w-full !py-4">{t('signup.verify_button')}</Button>
            
            <button onClick={handleResend} disabled={loading} className="w-full font-semibold py-3 text-accent hover:text-accent/80 disabled:opacity-50 mt-1">
                {t('signup.resend_code')}
            </button>

            <p className="text-sm bg-accent/10 text-accent/90 p-3 rounded-lg mt-8 max-w-xs border border-accent/20">
                {t('signup.verify_code_info')}
            </p>
        </div>
    );
};


export const SignUpScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVerificationScreen, setShowVerificationScreen] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('signup.error_passwords_mismatch'));
            return;
        }
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: name,
                },
            },
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else if (data.user) {
             if (data.user.identities && data.user.identities.length === 0) {
                setError(t('signup.error_user_exists'));
             } else {
                setSubmittedEmail(email);
                setShowVerificationScreen(true);
             }
        }
    };

    if (showVerificationScreen) {
        return <VerificationCodeScreen email={submittedEmail} />;
    }

    return (
         <div className="h-full flex flex-col justify-center p-8 text-foreground">
             <PageHeader title="" showBack={true} onBack={() => onNavigate('welcome')} />
             <div className="text-center mb-10">
                <h2 className="text-2xl font-bold">{t('signup.title')}</h2>
                <p className="text-muted-foreground">{t('signup.subtitle')}</p>
             </div>
             <form className="space-y-4" onSubmit={handleSignUp}>
                 <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('signup.name_label')}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" required />
                </div>
                 <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('login.email_label')}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" required />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('login.password_label')}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" required />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('signup.confirm_password_label')}</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full mt-1 bg-card border border-border rounded-lg p-3 focus:ring-ring focus:border-ring" required />
                </div>
                 {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
                 <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>{t('signup.submit_button')}</Button>
             </form>
             <p className="text-center text-muted-foreground mt-8">
                 {t('signup.login_prompt')} <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="font-semibold text-accent hover:text-accent/80">{t('signup.login_link')}</a>
             </p>
         </div>
    );
};