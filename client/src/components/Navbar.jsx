import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../hooks/useNotifications';
import { toMediaUrl } from '../utils/mediaUrl';

const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'text-slate-900 bg-white/95' : 'text-slate-600 hover:text-slate-900 hover:bg-white/95'
    }`;

// ─── Notification bell (admin only) ──────────────────────────────────────────
function NotificationBell() {
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setOpen((p) => !p);
        if (!open) markAllRead();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={handleOpen}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/90 border border-slate-200 hover:bg-white transition-colors"
                title="Notifications"
            >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <p className="text-sm font-semibold text-slate-800">
                                Orders
                                {notifications.length > 0 && (
                                    <span className="ml-2 text-xs text-slate-400 font-normal">
                                        ({notifications.length})
                                    </span>
                                )}
                            </p>
                            {notifications.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-400">
                                    <p className="text-2xl mb-2">🔔</p>
                                    <p className="text-xs">No orders yet</p>
                                    <p className="text-xs text-slate-300 mt-1">
                                        New orders will appear here
                                    </p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            navigate(`/orders/${n.orderId}`);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-base flex-shrink-0 mt-0.5">
                                                {n.isPaid ? '✅' : '📦'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {n.fromCatchup ? 'Order' : 'New order!'}
                                                    {n.userName ? ` from ${n.userName}` : ''}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    ${Number(n.totalPrice).toFixed(2)} ·{' '}
                                                    {n.itemCount} item{n.itemCount !== 1 ? 's' : ''} ·{' '}
                                                    <span
                                                        className={
                                                            n.isPaid
                                                                ? 'text-green-500'
                                                                : 'text-amber-500'
                                                        }
                                                    >
                                                        {n.isPaid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {new Date(n.createdAt).toLocaleString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <span className="text-xs text-accent-mint font-medium flex-shrink-0">
                                                View →
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    navigate('/admin/orders');
                                }}
                                className="text-xs text-accent-mint hover:text-accent-violet transition-colors font-medium"
                            >
                                View all orders →
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
    const { user, logout } = useAuth();
    const { count } = useCart();
    const [adminOpen, setAdminOpen] = useState(false);
    const adminRef = useRef();
    const navigate = useNavigate();

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
                                <span
                                    className={`text-[10px] transition-transform ${
                                        adminOpen ? 'rotate-180' : ''
                                    }`}
                                >
                                    ▾
                                </span>
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
                                            { to: '/admin/products', label: '✏️ Edit Products' },
                                        ].map(({ to, label }) => (
                                            <button
                                                key={to}
                                                type="button"
                                                onClick={() => {
                                                    navigate(to);
                                                    setAdminOpen(false);
                                                }}
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
                    {/* Admin notification bell */}
                    {user?.isAdmin && <NotificationBell />}

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
                                        <img
                                            src={toMediaUrl(user.image)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
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
                            <Link
                                to="/login"
                                className="text-sm px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900"
                            >
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
                {user?.isAdmin && (
                    <NavLink to="/admin/orders" className={linkClass}>Admin Orders</NavLink>
                )}
                {user?.isAdmin && (
                    <NavLink to="/admin/products/new" className={linkClass}>Add Product</NavLink>
                )}
                {user?.isAdmin && (
                    <NavLink to="/admin/products" className={linkClass}>Edit Products</NavLink>
                )}
            </div>
        </motion.header>
    );
}
