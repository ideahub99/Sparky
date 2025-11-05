
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts';
import type { Page } from '../types';
import { Button, PageHeader } from '../components/ui/Elements';
import { supabase } from '../lib/supabaseClient';

// FIX: Added WelcomeScreen component which was missing.
export const WelcomeScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 text-center text-foreground">
            <div className="flex-grow flex flex-col justify-center items-center">
                <h1 className="text-5xl font-bold mb-4 text-accent">Sparky</h1>
                <p className="text-muted-foreground mb-8 max-w-sm">{t('welcome.subtitle')}</p>
            </div>
            <div className="w-full space-y-3">
                <Button className="w-full !py-4" onClick={() => onNavigate('signup')}>{t('welcome.create_account')}</Button>
                <button className="w-full font-semibold py-3 text-accent hover:text-accent/80" onClick={() => onNavigate('login')}>{t('welcome.log_in')}</button>
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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
        }
        setLoading(false);
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

// FIX: Added CheckEmailScreen component which was missing.
const CheckEmailScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('signup.check_email_title')}</h2>
            <p className="text-muted-foreground mb-8">{t('signup.check_email_subtitle')}</p>
            <Button onClick={() => onNavigate('login')}>{t('signup.back_to_login')}</Button>
        </div>
    );
};

// FIX: Added SignUpScreen component which was missing.
export const SignUpScreen: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCheckEmail, setShowCheckEmail] = useState(false);

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
                setShowCheckEmail(true);
             }
        }
    };

    if (showCheckEmail) {
        return <CheckEmailScreen onNavigate={onNavigate} />;
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
