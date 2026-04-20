import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createStripeCheckoutSession, getOrder } from '../api';

export default function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [err, setErr] = useState('');

    const load = async () => {
        try {
            const o = await getOrder(id);
            setOrder(o);
        } catch {
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    const handlePay = async () => {
        setErr('');
        setPaying(true);
        try {
            const { url } = await createStripeCheckoutSession(id);
            if (!url) {
                throw new Error('No Stripe checkout URL returned');
            }
            window.location.href = url;
        } catch (e) {
            setErr(e.response?.data?.message || e.message || 'Stripe payment failed');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-500">Loading…</div>;
    }
    if (!order) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                Order not found. <Link to="/orders">Back to orders</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
            <Link to="/orders" className="text-sm text-slate-500 hover:text-accent-mint mb-8 inline-block">
                ← All orders
            </Link>
            <h1 className="font-display text-3xl font-bold">Order detail</h1>
            <p className="text-slate-500 font-mono text-sm mt-2">{order._id}</p>

            <div className="mt-8 p-6 rounded-2xl glass border border-white/10 space-y-6">
                <div>
                    <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-wide">Items</h2>
                    <ul className="mt-3 space-y-3">
                        {order.orderItems?.map((item, i) => (
                            <li key={i} className="flex justify-between gap-4 text-sm">
                                <span>
                                    {item.name} × {item.qty}
                                </span>
                                <span>${(item.price * item.qty).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-wide">Ship to</h2>
                    <p className="mt-2 text-slate-300">
                        {order.shippingAddress?.fullName}
                        <br />
                        {order.shippingAddress?.address}
                        <br />
                        {order.shippingAddress?.city} {order.shippingAddress?.postalCode}
                        <br />
                        {order.shippingAddress?.country}
                        <br />
                        {order.shippingAddress?.phone}
                    </p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Items</span>
                        <span>${order.itemsPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Shipping</span>
                        <span>${order.shippingPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Tax</span>
                        <span>${order.taxPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span>${order.totalPrice?.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            order.isPaid ? 'bg-accent-mint/20 text-accent-mint' : 'bg-accent-coral/20 text-accent-coral'
                        }`}
                    >
                        {order.isPaid ? 'Paid (demo)' : 'Unpaid'}
                    </span>
                    <span className="text-slate-500 text-sm capitalize">Status: {order.status}</span>
                </div>

                {!order.isPaid && (
                    <div>
                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={paying}
                            className="px-6 py-3 rounded-xl bg-white text-ink-950 font-bold hover:bg-slate-200 disabled:opacity-50"
                        >
                            {paying ? 'Redirecting to Stripe…' : 'Pay with Stripe'}
                        </button>
                        <p className="text-xs text-slate-600 mt-2">Secure checkout via Stripe only.</p>
                    </div>
                )}
                {err && <p className="text-accent-coral text-sm">{err}</p>}
            </div>
        </div>
    );
}
