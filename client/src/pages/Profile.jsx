import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { toMediaUrl } from '../utils/mediaUrl';
import { resendVerification } from '../api';

const FIELD = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-mint/50 transition-all';
const LABEL = 'block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2';

export default function Profile() {
    const { user, refreshUser } = useAuth();
    const fileRef = useRef();

    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });
    const [saving, setSaving] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const [preview, setPreview] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/me', form);
            await refreshUser();
            showToast('Profile updated successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setUploadingImg(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            await api.patch('/users/me/image', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();
            showToast('Profile picture updated');
        } catch (err) {
            showToast(err.response?.data?.message || 'Image upload failed', 'error');
            setPreview(null);
        } finally {
            setUploadingImg(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const avatarSrc = preview || toMediaUrl(user?.image) || null;
    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const emailVerified = user?.isEmailVerified ?? false;

    return (
        <div className="min-h-screen py-12 px-4">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
                            toast.type === 'error'
                                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                                : 'bg-accent-mint/20 border-accent-mint/30 text-accent-mint'
                        }`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint mb-1">Account</p>
                    <h1 className="text-3xl font-display font-bold text-white">My Profile</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden"
                >
                    {/* Top strip: avatar + name + email verification */}
                    <div className="px-8 pt-8 pb-6 border-b border-white/8 flex flex-wrap items-center gap-6">
                        {/* Avatar with upload */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400">{initials}</span>
                                )}
                                {uploadingImg && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                                        <div className="w-5 h-5 border-2 border-accent-mint border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-accent-mint text-ink-950 flex items-center justify-center text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                                title="Change photo"
                            >
                                ✎
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>

                        {/* Name + admin badge */}
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                            {user?.isAdmin && (
                                <span className="mt-1.5 inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-violet/20 text-accent-violet border border-accent-violet/30">
                                    Admin
                                </span>
                            )}
                        </div>

                        {/* Email verification status */}
                        <div className="flex flex-col items-end gap-1.5">
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                                    emailVerified
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                }`}
                            >
                                <span>{emailVerified ? '✓' : '!'}</span>
                                <span>{emailVerified ? 'Email verified' : 'Not verified'}</span>
                            </div>
                            {!emailVerified && (
                                <>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await resendVerification(user?.email);
                                                showToast('Verification email sent');
                                            } catch {
                                                showToast('Could not send email', 'error');
                                            }
                                        }}
                                        className="text-[11px] text-slate-500 hover:text-accent-mint transition-colors underline underline-offset-2"
                                    >
                                        Resend verification email
                                    </button>
                                    <p className="text-[11px] text-amber-500/70">Verify email to place orders</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Edit form */}
                    <form onSubmit={handleSave} className="px-8 py-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className={LABEL}>Full name</label>
                                <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" className={FIELD} />
                            </div>
                            <div>
                                <label className={LABEL}>Email</label>
                                <input value={user?.email || ''} disabled className={`${FIELD} opacity-40 cursor-not-allowed`} />
                            </div>
                            <div>
                                <label className={LABEL}>Phone</label>
                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" className={FIELD} />
                            </div>
                            <div>
                                <label className={LABEL}>Address</label>
                                <input name="address" value={form.address} onChange={handleChange} placeholder="City, Country" className={FIELD} />
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 pt-1">
                            <span className="text-slate-500">Member since </span>
                            {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                                : '—'}
                        </p>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />}
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
