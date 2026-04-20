import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerification } from '../api';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';
    const notice = location.state?.message || '';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendState, setResendState] = useState({ loading: false, msg: '', err: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        const shouldContinue = window.confirm('Do you want to sign in now?');
        if (!shouldContinue) return;
        setLoading(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (e) {
            setErr(e.response?.data?.message || 'Sign in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-20">
            <h1 className="font-display text-3xl font-bold text-center">Welcome back</h1>
            {notice && (
                <p className="text-sm text-emerald-600 text-center mt-3">{notice}</p>
            )}
            <p className="text-slate-500 text-center mt-2 mb-10">
                Demo: <code className="text-accent-violet text-xs">bssshoumi@gmail.com</code> /{' '}
                <code className="text-accent-violet text-xs">password123</code> (admin)
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 glass p-8 rounded-2xl border border-white/10">
                <div>
                    <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 focus:border-accent-violet outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 focus:border-accent-violet outline-none"
                    />
                </div>
                {err && <p className="text-accent-coral text-sm">{err}</p>}
                {err.toLowerCase().includes('verify your email') && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                        <p className="text-amber-700">
                            Email not verified yet. Click below to resend verification mail.
                        </p>
                        <button
                            type="button"
                            disabled={resendState.loading || !email.trim()}
                            onClick={async () => {
                                setResendState({ loading: true, msg: '', err: '' });
                                try {
                                    const result = await resendVerification(email.trim());
                                    setResendState({
                                        loading: false,
                                        msg: result?.message || 'Verification email sent.',
                                        err: '',
                                    });
                                } catch (error) {
                                    setResendState({
                                        loading: false,
                                        msg: '',
                                        err:
                                            error.response?.data?.message ||
                                            'Could not resend verification email.',
                                    });
                                }
                            }}
                            className="mt-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-medium disabled:opacity-60"
                        >
                            {resendState.loading ? 'Sending…' : 'Resend verification email'}
                        </button>
                        {resendState.msg && <p className="mt-2 text-emerald-700">{resendState.msg}</p>}
                        {resendState.err && <p className="mt-2 text-red-600">{resendState.err}</p>}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold disabled:opacity-50"
                >
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="text-center text-sm text-slate-500">
                    No account?{' '}
                    <Link to="/register" className="text-accent-mint hover:underline">
                        Create one
                    </Link>
                </p>
            </form>
        </div>
    );
}
