import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
    });
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        try {
            const result = await register(form);
            navigate('/verify-pending', {
                replace: true,
                state: {
                    email: form.email,
                    message:
                        result?.requiresVerification
                            ? 'Account created. Please verify your email.'
                            : 'Registration complete.',
                },
            });
        } catch (e) {
            setErr(e.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <h1 className="font-display text-3xl font-bold text-center">Create account</h1>
            <p className="text-slate-500 text-center mt-2 mb-10">Join SCOMM in seconds.</p>
            <form onSubmit={handleSubmit} className="space-y-4 glass p-8 rounded-2xl border border-white/10">
                {['name', 'email', 'password', 'phone', 'address'].map((field) => (
                    <div key={field}>
                        <label htmlFor={field} className="block text-sm text-slate-400 mb-1 capitalize">
                            {field === 'address' ? 'Address' : field}
                        </label>
                        <input
                            id={field}
                            name={field}
                            type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                            required
                            minLength={field === 'password' ? 6 : undefined}
                            value={form[field]}
                            onChange={onChange}
                            className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 focus:border-accent-violet outline-none"
                        />
                    </div>
                ))}
                {err && <p className="text-accent-coral text-sm">{err}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold disabled:opacity-50"
                >
                    {loading ? 'Creating…' : 'Register'}
                </button>
                <p className="text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent-mint hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
