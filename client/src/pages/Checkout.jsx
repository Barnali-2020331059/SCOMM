import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Checkout() {
    const { user } = useAuth();
    const { items, subtotal, clearCart } = useCart();
    const navigate = useNavigate();
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const [form, setForm] = useState({
        fullName: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        phone: '',
    });

    useEffect(() => {
        if (!user) return;
        setForm((f) => ({
            ...f,
            fullName: f.fullName || user.name || '',
            address: f.address || user.address || '',
            phone: f.phone || user.phone || '',
        }));
    }, [user]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');

    const onChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        if (items.length === 0) {
            setErr('Cart is empty');
            return;
        }
        const shouldPlaceOrder = window.confirm(
            `Confirm placing this order for $${total.toFixed(2)}?`
        );
        if (!shouldPlaceOrder) return;
        setSubmitting(true);
        try {
            const order = await createOrder({
                orderItems: items.map((i) => ({ product: i._id, qty: i.qty })),
                shippingAddress: form,
                paymentMethod: 'card',
            });
            clearCart();
            navigate(`/orders/${order._id}`, { replace: true });
        } catch (e) {
            setErr(e.response?.data?.message || 'Could not place order');
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <p className="text-slate-500">Nothing to checkout.</p>
                <Link to="/shop" className="text-accent-mint mt-4 inline-block">
                    Go to shop
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>
            <div className="grid lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="font-semibold text-lg">Shipping</h2>
                    {[
                        ['fullName', 'Full name'],
                        ['address', 'Street address'],
                        ['city', 'City'],
                        ['postalCode', 'Postal code'],
                        ['country', 'Country'],
                        ['phone', 'Phone'],
                    ].map(([name, label]) => (
                        <div key={name}>
                            <label htmlFor={name} className="block text-sm text-slate-400 mb-1">
                                {label}
                            </label>
                            <input
                                id={name}
                                name={name}
                                required
                                value={form[name]}
                                onChange={onChange}
                                className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 focus:border-accent-violet outline-none"
                            />
                        </div>
                    ))}
                    {err && <p className="text-accent-coral text-sm">{err}</p>}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold disabled:opacity-50"
                    >
                        {submitting ? 'Placing order…' : `Place order · $${total.toFixed(2)}`}
                    </button>
                </form>
                <div className="p-6 rounded-2xl glass border border-white/10 h-fit">
                    <h2 className="font-display font-bold mb-4">Order preview</h2>
                    <ul className="space-y-3 text-sm text-slate-400 max-h-64 overflow-y-auto">
                        {items.map((i) => (
                            <li key={i._id} className="flex justify-between gap-4">
                                <span className="text-white">
                                    {i.name} × {i.qty}
                                </span>
                                <span>${(i.price * i.qty).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-white/10 mt-4 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Shipping</span>
                            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tax</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-white pt-2">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
