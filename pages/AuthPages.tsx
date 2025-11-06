import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../contexts';
import type { Page } from '../types';
import { Button, PageHeader } from '../components/ui/Elements';
import { supabase } from '../lib/supabaseClient';
import { LogoIcon, SparklesIcon, UserSearchIcon, ClockIcon, PaintBrushIcon, FaceSmileIcon, EyeIcon, EnvelopeIcon, UserPlusIcon, MessageCodeIcon, KeyIcon } from '../components/icons';

export const WelcomeScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    
    const orbitalIcons = useMemo(() => [
        { icon: SparklesIcon, color: '#ec4899', size: 50, distance: 0.25, angle: 20 },
        { icon: UserSearchIcon, color: '#f59e0b', size: 44, distance: 0.4, angle: 80 },
        { icon: ClockIcon, color: '#8b5cf6', size: 60, distance: 0.35, angle: 150 },
        { icon: PaintBrushIcon, color: '#10b981', size: 48, distance: 0.45, angle: 220 },
        { icon: FaceSmileIcon, color: '#3b82f6', size: 52, distance: 0.3, angle: 280 },
        { icon: EyeIcon, color: '#ef4444', size: 40, distance: 0.4, angle: 340 },
    ], []);

    return (
        <div className="min-h-full flex flex-col justify-between items-center p-6 text-center text-foreground dark-gradient-background overflow-hidden">
            <div className="w-full flex justify-center items-center flex-grow relative -mt-10">
                <div className="orbit-container">
                    {/* Concentric circle paths */}
                    <div className="orbit-path" style={{ width: '60%', height: '60%' }}></div>
                    <div className="orbit-path" style={{ width: '85%', height: '85%' }}></div>
                    
                    {/* Central Star */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                         <SparklesIcon className="w-12 h-12 text-orange-400 opacity-80" style={{ filter: 'drop-shadow(0 0 10px #fb923c)'}} />
                    </div>

                    {/* Orbiting Icons */}
                    <div className="w-full h-full animate-orbit-rotate">
                        {orbitalIcons.map((item, index) => {
                            const radius = 50 * (1 - item.distance); // in %
                            const x = 50 + radius * Math.cos(item.angle * Math.PI / 180);
                            const y = 50 + radius * Math.sin(item.angle * Math.PI / 180);
                            return (
                                <div key={index} className="orbit-icon" style={{ left: `${x}%`, top: `${y}%`}}>
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center animate-icon-float"
                                        style={{ 
                                            backgroundColor: item.color,
                                            boxShadow: `0 4px 20px ${item.color}40`,
                                            animationDelay: `${index * 0.3}s`
                                        }}
                                    >
                                        <item.icon className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center z-10">
                <div className="flex items-center gap-2 mb-3">
                    <LogoIcon className="w-7 h-7 text-accent" />
                    <span className="text-2xl font-bold tracking-tight text-gray-200">{t("welcome.title")}</span>
                </div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-2">Transform Your Photos</h1>
                <h2 className="text-4xl font-bold tracking-tight gradient-text mb-8">Start Here</h2>
                
                <Button
                    onClick={() => onNavigate('signup')}
                    className="w-full !py-4 text-lg transition-transform hover:scale-105"
                >
                    Get Started
                </Button>
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            const { error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', authData.user.id)
                .single(); 

            if (profileError) {
                setError("Login failed: User profile not found. Please contact support.");
                await supabase.auth.signOut();
                setLoading(false);
            }
        } else {
            setError("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full flex flex-col p-4">
            <PageHeader title="" showBack={true} onBack={() => onNavigate('welcome')} />
            <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                <div className="bg-card border border-border p-4 rounded-full mb-6">
                    <EnvelopeIcon className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-3xl font-bold mb-2">{t('login.title')}</h2>
                <p className="text-muted-foreground mb-8">{t('login.subtitle')}</p>
                
                <form className="w-full max-w-sm space-y-4" onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" 
                        placeholder={t('login.email_label')}
                        required 
                    />
                     <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" 
                        placeholder={t('login.password_label')}
                        required 
                    />
                    <div className="text-right">
                         <button type="button" onClick={() => onNavigate('forgot-password')} className="text-sm font-semibold text-accent hover:text-accent/80">Forgot Password?</button>
                    </div>

                    {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
                    
                    <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>{t('login.submit_button')}</Button>
                </form>
                <p className="text-center text-muted-foreground mt-8">
                    {t('login.signup_prompt')} <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="font-semibold text-accent hover:text-accent/80">{t('login.signup_link')}</a>
                </p>
            </div>
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
        const value = element.value;
        if (!/^[0-9]*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Move to next input if a character was entered and it's not the last input
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
        // Sanitize to only get digits, and trim to max 6
        const pastedCode = pastedText.replace(/\D/g, '').slice(0, 6);

        if (pastedCode) {
            e.preventDefault();
            const newCode = pastedCode.split('').concat(new Array(6 - pastedCode.length).fill(''));
            setCode(newCode);
            
            const focusIndex = Math.min(pastedCode.length, 5);
            const inputToFocus = inputsRef.current[focusIndex];
            // Use a timeout to focus after the state update has rendered
            if (inputToFocus) {
                setTimeout(() => inputToFocus.focus(), 0);
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
        setMessage(null);
        
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (error) {
            setError(error.message);
        }
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
                            type="tel"
                            inputMode="numeric"
                            maxLength={1}
                            value={code[index]}
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
            {message && <p className="text-green-500 text-sm my-4">{message}</p>}
            
            <div className="w-full max-w-sm">
                <Button onClick={handleVerify} isLoading={loading} className="w-full !py-4">{t('signup.verify_button')}</Button>
                <button onClick={handleResend} disabled={loading} className="w-full font-semibold py-3 text-accent hover:text-accent/80 disabled:opacity-50 mt-2">
                    {t('signup.resend_code')}
                </button>
            </div>
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
         <div className="min-h-full flex flex-col p-4">
             <PageHeader title="" showBack={true} onBack={() => onNavigate('welcome')} />
             <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                <div className="bg-card border border-border p-4 rounded-full mb-6">
                    <UserPlusIcon className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-3xl font-bold mb-2">{t('signup.title')}</h2>
                <p className="text-muted-foreground mb-8">{t('signup.subtitle')}</p>

                <form className="w-full max-w-sm space-y-4" onSubmit={handleSignUp}>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('signup.name_label')} className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" required />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.email_label')} className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" required />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password_label')} className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" required />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('signup.confirm_password_label')} className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" required />

                    {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
                    <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>{t('signup.submit_button')}</Button>
                </form>
                <p className="text-center text-muted-foreground mt-8">
                    {t('signup.login_prompt')} <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="font-semibold text-accent hover:text-accent/80">{t('signup.login_link')}</a>
                </p>
             </div>
         </div>
    );
};

const PasswordResetVerificationScreen: React.FC<{ email: string; onNavigate: (page: Page) => void; }> = ({ email, onNavigate }) => {
    const { t } = useTranslation();
    const [code, setCode] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

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
        
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery',
        });

        if (error) {
            setError(error.message);
        } else {
            onNavigate('update-password');
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

export const ForgotPasswordScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            setError(error.message);
        } else {
            setSubmittedEmail(email);
        }
        setLoading(false);
    };

    if (submittedEmail) {
        return (
            <div className="min-h-full flex flex-col p-4">
                <PageHeader title="" showBack={true} onBack={() => setSubmittedEmail(null)} />
                <PasswordResetVerificationScreen email={submittedEmail} onNavigate={onNavigate} />
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col p-4">
            <PageHeader title="" showBack={true} onBack={() => onNavigate('login')} />
            <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                <div className="bg-card border border-border p-4 rounded-full mb-6">
                    <KeyIcon className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Forgot Password?</h2>
                <p className="text-muted-foreground mb-8 max-w-sm">No worries! Enter your email and we'll send you a code to reset it.</p>
                
                <form className="w-full max-w-sm space-y-4" onSubmit={handlePasswordReset}>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-accent focus:border-accent" 
                        placeholder={t('login.email_label')}
                        required 
                    />
                    {error && <p className="text-destructive text-sm text-center pt-2">{error}</p>}
                    <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>Send Code</Button>
                </form>
            </div>
        </div>
    );
};


export const UpdatePasswordScreen: React.FC<{ onNavigate: (page: Page, resetStack?: boolean) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

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
        setMessage(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setMessage("Password updated successfully! You will be redirected shortly.");
            setTimeout(() => {
                onNavigate('home', true);
            }, 2500);
        }
    };

    return (
        <div className="min-h-full flex flex-col p-4">
            <PageHeader title="" showBack={false} />
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
                    {message && <p className="text-green-400 text-sm text-center pt-2">{message}</p>}

                    <Button type="submit" className="w-full !py-4 !mt-6" isLoading={loading}>Update Password</Button>
                </form>
            </div>
        </div>
    );
};