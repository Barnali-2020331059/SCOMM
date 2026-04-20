import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resendVerification } from '../api';

const COOLDOWN_SECONDS = 60;

export default function VerifyPending() {
    const location = useLocation();
    const emailFromState = location.state?.email || '';
    const initialMessage =
        location.state?.message || 'Please verify your email address before signing in.';

    const [email, setEmail] = useState(emailFromState);
    const [message, setMessage] = useState(initialMessage);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const canResend = useMemo(
        () => !sending && cooldown === 0 && String(email).trim().length > 0,
        [sending, cooldown, email],
    );

    const handleResend = async () => {
        if (!canResend) return;
        setSending(true);
        setError('');
        setMessage('');
        try {
            const response = await resendVerification(String(email).trim());
            setMessage(response?.message || 'Verification email sent.');
            setCooldown(COOLDOWN_SECONDS);
        } catch (e) {
            setError(e.response?.data?.message || 'Could not resend verification email.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <h1 className="font-display text-3xl font-bold text-center">Check Your Inbox</h1>
            <p className="text-slate-600 text-center mt-3">
                We sent a verification link to your email. Open it to activate your account.
            </p>

            <div className="mt-8 glass p-6 rounded-2xl border border-white/10 space-y-4">
                <label htmlFor="verify-email" className="block text-sm text-slate-500">
                    Email
                </label>
                <input
                    id="verify-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 focus:border-accent-violet outline-none"
                />

                {message && <p className="text-sm text-emerald-600">{message}</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                    type="button"
                    disabled={!canResend}
                    onClick={handleResend}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold disabled:opacity-50"
                >
                    {sending
                        ? 'Sending...'
                        : cooldown > 0
                            ? `Resend available in ${cooldown}s`
                            : 'Resend verification email'}
                </button>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
                Verified already?{' '}
                <Link to="/login" className="text-accent-mint hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
