import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { toMediaUrl } from '../utils/mediaUrl';

export default function Cart() {
    const { items, subtotal, setQty, removeItem } = useCart();
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const handleRemoveItem = (item) => {
        const shouldRemove = window.confirm(`Remove "${item.name}" from your cart?`);
        if (!shouldRemove) return;
        removeItem(item._id);
    };

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
                <p className="text-slate-500 mt-4">Add something beautiful from the shop.</p>
                <Link
                    to="/shop"
                    className="inline-block mt-8 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold"
                >
                    Continue shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="font-display text-3xl font-bold mb-10">Cart</h1>
            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <motion.div
                            layout
                            key={item._id}
                            className="flex gap-4 p-4 rounded-2xl glass border border-white/10"
                        >
                            <Link to={`/product/${item._id}`} className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                                <img src={toMediaUrl(item.image)} alt="" className="w-full h-full object-cover" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/product/${item._id}`}
                                    className="font-semibold text-white hover:text-accent-mint line-clamp-2"
                                >
                                    {item.name}
                                </Link>
                                <p className="text-sm text-slate-500 mt-1">{item.category}</p>
                                <p className="text-lg font-bold mt-2">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center rounded-lg border border-white/15">
                                    <button
                                        type="button"
                                        className="px-2 py-1 hover:bg-white/10"
                                        onClick={() => setQty(item._id, item.qty - 1, item.countInStock)}
                                    >
                                        −
                                    </button>
                                    <span className="px-3 py-1 text-sm">{item.qty}</span>
                                    <button
                                        type="button"
                                        className="px-2 py-1 hover:bg-white/10"
                                        onClick={() => setQty(item._id, item.qty + 1, item.countInStock)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item)}
                                    className="text-sm text-accent-coral hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-24 p-6 rounded-2xl glass border border-white/10">
                        <h2 className="font-display font-bold text-lg mb-4">Summary</h2>
                        <div className="space-y-2 text-sm text-slate-400">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="text-white">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="text-white">
                                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Est. tax</span>
                                <span className="text-white">${tax.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="border-t border-white/10 mt-4 pt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <Link
                            to="/checkout"
                            className="mt-6 block text-center w-full py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold"
                        >
                            Checkout
                        </Link>
                        <Link to="/shop" className="block text-center mt-4 text-sm text-slate-500 hover:text-white">
                            ← Keep shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
