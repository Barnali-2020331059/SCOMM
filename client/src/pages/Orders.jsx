import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const o = await getMyOrders();
                if (!cancelled) setOrders(o);
            } catch {
                if (!cancelled) setOrders([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-slate-500 text-center">Loading orders…</div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="font-display text-3xl font-bold mb-8">Your orders</h1>
            {orders.length === 0 ? (
                <p className="text-slate-500">
                    No orders yet.{' '}
                    <Link to="/shop" className="text-accent-mint hover:underline">
                        Start shopping
                    </Link>
                </p>
            ) : (
                <ul className="space-y-4">
                    {orders.map((o) => (
                        <li key={o._id}>
                            <Link
                                to={`/orders/${o._id}`}
                                className="block p-6 rounded-2xl glass border border-white/10 hover:border-accent-violet/40 transition-colors"
                            >
                                <div className="flex flex-wrap justify-between gap-4">
                                    <div>
                                        <p className="font-mono text-sm text-slate-500">
                                            {o._id.slice(-8).toUpperCase()}
                                        </p>
                                        <p className="text-lg font-semibold mt-1">
                                            ${o.totalPrice?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm text-slate-400">
                                        <p>{new Date(o.createdAt).toLocaleDateString()}</p>
                                        <p
                                            className={
                                                o.isPaid ? 'text-accent-mint mt-1' : 'text-accent-coral mt-1'
                                            }
                                        >
                                            {o.isPaid ? 'Paid' : 'Awaiting payment'}
                                        </p>
                                        <p className="mt-1 capitalize text-slate-500">{o.status}</p>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
