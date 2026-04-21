import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrder, createStripeCheckoutSession } from '../api';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const statusColor = (status) => {
    switch (status) {
        case 'pending':    return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'shipped':    return 'text-violet-600 bg-violet-50 border-violet-200';
        case 'delivered':  return 'text-green-600 bg-green-50 border-green-200';
        case 'cancelled':  return 'text-red-500 bg-red-50 border-red-200';
        default:           return 'text-slate-500 bg-slate-50 border-slate-200';
    }
};

export default function OrderDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paymentMsg, setPaymentMsg] = useState('');
    const [paymentMsgType, setPaymentMsgType] = useState('info');
    const [err, setErr] = useState('');

    const loadOrder = useCallback(async () => {
        try {
            const o = await getOrder(id);
            setOrder(o);
            return o;
        } catch {
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Handle Stripe redirect back
    useEffect(() => {
        const stripeSession = searchParams.get('stripe_session');
        const cancelled = searchParams.get('cancelled');
        const paidParam = searchParams.get('paid');

        if (cancelled) {
            setPaymentMsg('Payment was cancelled. Your order is saved — you can pay later.');
            setPaymentMsgType('warning');
            loadOrder();
            return;
        }

        if (stripeSession) {
            setPaymentMsg('Confirming your payment…');
            setPaymentMsgType('info');
            api.post('/stripe/confirm-payment', {
                orderId: id,
                stripeSessionId: stripeSession,
            })
                .then(() => {
                    setPaymentMsg('✅ Payment confirmed! Your order is being processed.');
                    setPaymentMsgType('success');
                    loadOrder();
                })
                .catch(() => {
                    setPaymentMsg('Payment received — your order will update shortly.');
                    setPaymentMsgType('info');
                    loadOrder();
                });
            return;
        }

        if (paidParam === '1' || paidParam === 'true') {
            api.post('/stripe/confirm-payment', { orderId: id })
                .finally(() => {
                    setPaymentMsg('✅ Payment confirmed!');
                    setPaymentMsgType('success');
                    loadOrder();
                });
            return;
        }

        loadOrder();
    }, [id, searchParams, loadOrder]);

    const handlePay = async () => {
        setErr('');
        setPaying(true);
        try {
            const { url } = await createStripeCheckoutSession(id);
            if (!url) throw new Error('No Stripe checkout URL returned');
            window.location.href = url;
        } catch (e) {
            setErr(e.response?.data?.message || e.message || 'Stripe payment failed');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400">
                Loading order…
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-500">
                Order not found.{' '}
                <Link to="/orders" className="text-accent-mint underline">Back to orders</Link>
            </div>
        );
    }

    const stepIndex = STATUS_STEPS.indexOf(order.status);

    const msgClass = {
        success: 'bg-green-50 border-green-200 text-green-700',
        warning: 'bg-amber-50 border-amber-200 text-amber-700',
        info:    'bg-blue-50 border-blue-200 text-blue-700',
    }[paymentMsgType] || 'bg-blue-50 border-blue-200 text-blue-700';

    // ✅ Only show Pay button if the logged-in user is the order owner (not admin viewing another's order)
    const orderId = order.user?._id || order.user;
    const isOwner = user && String(orderId) === String(user._id || user.id);
    const showPayButton = !order.isPaid && isOwner;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
            {/* Payment message banner */}
            {paymentMsg && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 px-5 py-3 rounded-xl text-sm font-medium border ${msgClass}`}
                >
                    {paymentMsg}
                </motion.div>
            )}

            {/* Back + header */}
            <Link
                to="/orders"
                className="text-sm text-slate-400 hover:text-accent-mint mb-6 inline-block"
            >
                ← All orders
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">
                        Order{' '}
                        <span className="font-mono text-lg text-slate-400">
                            …{order._id.slice(-8).toUpperCase()}
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border capitalize ${statusColor(order.status)}`}
                    >
                        {order.status}
                    </span>
                    <span
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                            order.isPaid
                                ? 'bg-green-50 border-green-200 text-green-600'
                                : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}
                    >
                        {order.isPaid ? '✓ Paid' : '⏳ Awaiting payment'}
                    </span>
                </div>
            </div>

            {/* Status timeline */}
            {order.status !== 'cancelled' && (
                <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                        Order progress
                    </p>
                    <div className="flex items-center">
                        {STATUS_STEPS.map((step, i) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                            i <= stepIndex
                                                ? 'bg-accent-mint border-accent-mint text-white'
                                                : 'bg-white border-slate-200 text-slate-300'
                                        }`}
                                    >
                                        {i < stepIndex ? '✓' : i + 1}
                                    </div>
                                    <p
                                        className={`text-[10px] mt-1.5 capitalize font-medium ${
                                            i <= stepIndex ? 'text-accent-mint' : 'text-slate-300'
                                        }`}
                                    >
                                        {step}
                                    </p>
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                    <div
                                        className={`h-0.5 flex-1 -mt-4 transition-colors ${
                                            i < stepIndex ? 'bg-accent-mint' : 'bg-slate-100'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
                <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                        Items ({order.orderItems.length})
                    </p>
                </div>
                {order.orderItems?.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0"
                    >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">
                                    📦
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Qty: {item.qty} × ${item.price?.toFixed(2)}
                            </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 flex-shrink-0">
                            ${(item.price * item.qty).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Price summary + shipping address */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Price summary</p>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>${order.itemsPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Shipping</span>
                        <span>
                            {order.shippingPrice === 0 ? 'FREE' : `$${order.shippingPrice?.toFixed(2)}`}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Tax (8%)</span>
                        <span>${order.taxPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2 mt-1">
                        <span>Total</span>
                        <span>${order.totalPrice?.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Shipping address</p>
                    {order.shippingAddress ? (
                        <div className="text-sm text-slate-600 space-y-0.5">
                            <p className="font-medium text-slate-800">
                                {order.shippingAddress.fullName}
                            </p>
                            <p>{order.shippingAddress.address}</p>
                            <p>
                                {order.shippingAddress.city}
                                {order.shippingAddress.postalCode
                                    ? `, ${order.shippingAddress.postalCode}`
                                    : ''}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.phone && (
                                <p className="text-slate-400">{order.shippingAddress.phone}</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">No address provided</p>
                    )}
                </div>
            </div>

            {/* ✅ Pay button — only shown to the order owner, never to admin viewing another's order */}
            {showPayButton && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Payment required</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            Complete your payment to confirm this order.
                        </p>
                        <p className="text-xs text-amber-500 mt-1">Secure checkout via Stripe.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handlePay}
                        disabled={paying}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                        {paying && (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {paying ? 'Redirecting to Stripe…' : `Pay $${order.totalPrice?.toFixed(2)} →`}
                    </button>
                </div>
            )}

            {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
        </div>
    );
}
