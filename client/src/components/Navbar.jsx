import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toMediaUrl } from '../utils/mediaUrl';

const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'text-slate-900 bg-white/95' : 'text-slate-600 hover:text-slate-900 hover:bg-white/95'
    }`;

export default function Navbar() {
    const { user, logout } = useAuth();
    const { count } = useCart();
    const [adminOpen, setAdminOpen] = useState(false);
    const adminRef = useRef();
    const navigate = useNavigate();

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (adminRef.current && !adminRef.current.contains(e.target)) {
                setAdminOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        const shouldLogout = window.confirm('Are you sure you want to log out?');
        if (!shouldLogout) return;
        logout();
    };

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 border-b border-slate-200/80 glass"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-2xl" aria-hidden>◈</span>
                    <span className="font-display font-bold text-xl tracking-tight">
                        SCOMM<span className="text-accent-mint">.</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    <NavLink to="/" className={linkClass} end>Home</NavLink>
                    <NavLink to="/shop" className={linkClass}>Shop</NavLink>

                    {/* AI Chat link */}
                    <NavLink
                        to="/chat"
                        className={({ isActive }) =>
                            `px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                isActive
                                    ? 'text-slate-900 bg-white/95'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/95'
                            }`
                        }
                    >
                        <span className="text-accent-mint">✦</span> AI Chat
                    </NavLink>

                    {user && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}

                    {/* Admin dropdown */}
                    {user?.isAdmin && (
                        <div className="relative" ref={adminRef}>
                            <button
                                type="button"
                                onClick={() => setAdminOpen((p) => !p)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                    adminOpen
                                        ? 'text-slate-900 bg-white/95'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/95'
                                }`}
                            >
                                Admin
                                <span className={`text-[10px] transition-transform ${adminOpen ? 'rotate-180' : ''}`}>▾</span>
                            </button>
                            <AnimatePresence>
                                {adminOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl overflow-hidden"
                                    >
                                        {[
                                            { to: '/admin/orders', label: '📦 Manage Orders' },
                                            { to: '/admin/products/new', label: '＋ Add Product' },
                                        ].map(({ to, label }) => (
                                            <button
                                                key={to}
                                                type="button"
                                                onClick={() => { navigate(to); setAdminOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/90 border border-slate-200 hover:bg-white transition-colors"
                    >
                        <span className="text-lg">🛒</span>
                        {count > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-[10px] font-bold bg-accent-coral text-white rounded-full">
                                {count > 99 ? '99+' : count}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/profile"
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/95 transition-colors group"
                            >
                                <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                                    {user.image ? (
                                        <img src={toMediaUrl(user.image)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors max-w-[120px] truncate">
                                    {user.name}
                                </span>
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white transition-colors"
                            >
                                Log out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900">
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-semibold hover:opacity-90"
                            >
                                Join
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile nav */}
            <div className="md:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
                <NavLink to="/" className={linkClass} end>Home</NavLink>
                <NavLink to="/shop" className={linkClass}>Shop</NavLink>
                <NavLink to="/chat" className={linkClass}>✦ AI Chat</NavLink>
                {user && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}
                {user && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
                {user?.isAdmin && <NavLink to="/admin/orders" className={linkClass}>Admin Orders</NavLink>}
                {user?.isAdmin && <NavLink to="/admin/products/new" className={linkClass}>Add Product</NavLink>}
            </div>
        </motion.header>
    );
}
