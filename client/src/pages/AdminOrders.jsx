import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../api';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const sensitiveStatuses = new Set(['cancelled', 'delivered']);

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const o = await getAdminOrders();
            setOrders(o);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const changeStatus = async (id, status) => {
        if (sensitiveStatuses.has(status)) {
            const shouldContinue = window.confirm(
                `Are you sure you want to mark this order as "${status}"?`
            );
            if (!shouldContinue) return;
        }
        setUpdating(id);
        try {
            await updateOrderStatus(id, status);
            await load();
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-500">Loading…</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="font-display text-3xl font-bold mb-2">Admin · Orders</h1>
            <p className="text-slate-500 mb-10">Update fulfillment status for any order.</p>
            <div className="overflow-x-auto rounded-2xl border border-white/10 glass">
                <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 border-b border-white/10">
                        <tr>
                            <th className="p-4">Order</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Paid</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o._id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4">
                                    <Link to={`/orders/${o._id}`} className="text-accent-mint font-mono text-xs">
                                        …{o._id.slice(-6)}
                                    </Link>
                                </td>
                                <td className="p-4 text-slate-300">
                                    {o.user?.name || '—'}
                                    <br />
                                    <span className="text-slate-600 text-xs">{o.user?.email}</span>
                                </td>
                                <td className="p-4 font-medium">${o.totalPrice?.toFixed(2)}</td>
                                <td className="p-4">{o.isPaid ? '✓' : '—'}</td>
                                <td className="p-4">
                                    <select
                                        value={o.status}
                                        disabled={updating === o._id}
                                        onChange={(e) => changeStatus(o._id, e.target.value)}
                                        className="bg-ink-800 border border-white/15 rounded-lg px-2 py-1 text-xs"
                                    >
                                        {statuses.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {orders.length === 0 && <p className="text-slate-500 mt-8 text-center">No orders in the system.</p>}
        </div>
    );
}
