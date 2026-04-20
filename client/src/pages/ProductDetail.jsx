import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct } from '../api';
import { useCart } from '../context/CartContext';
import { toMediaUrl } from '../utils/mediaUrl';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState('');
    const { addToCart } = useCart();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const p = await getProduct(id);
                if (!cancelled) {
                    setProduct(p);
                    setQty(1);
                    setActiveImage(toMediaUrl(p.image));
                }
            } catch {
                if (!cancelled) setProduct(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-500">Loading…</div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-500">
                Product not found.{' '}
                <Link to="/shop" className="text-accent-mint underline">
                    Back to shop
                </Link>
            </div>
        );
    }

    const max = product.countInStock || 0;
    const canBuy = max > 0;
    const gallery = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
        .map((img) => toMediaUrl(img))
        .filter(Boolean);
    const shownImage = activeImage || gallery[0];

    const handleAdd = () => {
        setError('');
        if (!canBuy) {
            setError('Out of stock');
            return;
        }
        addToCart(product, qty);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <nav className="text-sm text-slate-500 mb-8">
                <Link to="/shop" className="hover:text-accent-mint">
                    Shop
                </Link>
                <span className="mx-2">/</span>
                <span className="text-slate-400">{product.category}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl overflow-hidden glass border border-white/10 aspect-square lg:aspect-auto lg:max-h-[560px]"
                    >
                        <img src={shownImage} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                    {gallery.length > 1 && (
                        <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3 lg:hidden">
                            {gallery.map((img, idx) => (
                                <button
                                    key={`${img}-${idx}`}
                                    type="button"
                                    onClick={() => setActiveImage(img)}
                                    className={`rounded-xl overflow-hidden border-2 ${
                                        shownImage === img ? 'border-accent-violet' : 'border-slate-200'
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-20 object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-accent-mint text-sm font-medium">{product.brand}</p>
                    <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">{product.name}</h1>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
                        <span className="text-slate-500 text-sm">
                            ★ {product.rating?.toFixed(1)} ({product.numReviews} reviews)
                        </span>
                    </div>
                    <p className="text-slate-400 mt-6 leading-relaxed">{product.description}</p>
                    {gallery.length > 1 && (
                        <div className="mt-6 hidden lg:grid grid-cols-5 gap-3">
                            {gallery.map((img, idx) => (
                                <button
                                    key={`${img}-${idx}`}
                                    type="button"
                                    onClick={() => setActiveImage(img)}
                                    className={`rounded-xl overflow-hidden border-2 ${
                                        shownImage === img ? 'border-accent-violet' : 'border-slate-200'
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-20 object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-sm">
                        <span className="text-slate-500">Stock:</span>{' '}
                        <span className={max > 0 ? 'text-accent-mint' : 'text-accent-coral'}>
                            {max > 0 ? `${max} available` : 'Sold out'}
                        </span>
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <div className="flex items-center rounded-xl border border-white/15 overflow-hidden">
                            <button
                                type="button"
                                className="px-4 py-3 hover:bg-white/10"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                            >
                                −
                            </button>
                            <span className="px-6 py-3 min-w-[3rem] text-center font-medium">{qty}</span>
                            <button
                                type="button"
                                className="px-4 py-3 hover:bg-white/10"
                                onClick={() => setQty((q) => Math.min(max || 1, q + 1))}
                                disabled={!canBuy}
                            >
                                +
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!canBuy}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold disabled:opacity-40"
                        >
                            Add to cart
                        </button>
                    </div>
                    {error && <p className="text-accent-coral text-sm mt-3">{error}</p>}
                </motion.div>
            </div>
        </div>
    );
}
