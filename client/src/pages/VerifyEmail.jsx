import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailToken } from '../api';

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Verification token is missing.');
            return;
        }
        (async () => {
            try {
                const result = await verifyEmailToken(token);
                setStatus('success');
                setMessage(result?.message || 'Email verified successfully.');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed.');
            }
        })();
    }, [params]);

    return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Email Verification</h1>
            <p
                className={`text-sm ${
                    status === 'success' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-slate-500'
                }`}
            >
                {message}
            </p>
            <div className="mt-8">
                <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-semibold"
                >
                    Go to Sign in
                </Link>
            </div>
        </div>
    );
}
