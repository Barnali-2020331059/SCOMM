import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategories, getProducts } from '../api';
import ProductCard from '../components/ProductCard';

const categoryMeta = {
    Electronics: '⚡',
    Fashion: '👗',
    'Home & Living': '🏠',
    Sports: '🏃',
    Beauty: '✨',
    Books: '📚',
};

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [fp, cats] = await Promise.all([
                    getProducts({ featured: true, limit: 8 }),
                    getCategories(),
                ]);
                if (!cancelled) {
                    setFeatured(fp.products);
                    setCategories(cats);
                }
            } catch {
                if (!cancelled) {
                    setFeatured([]);
                    setCategories([]);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                    >
                        <p className="text-accent-mint font-medium text-sm tracking-widest uppercase mb-4">
                            New season · SCOMM
                        </p>
                        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05]">
                            Commerce that feels{' '}
                            <span className="text-gradient">alive</span>.
                        </h1>
                        <p className="mt-6 text-lg text-slate-600 max-w-xl">
                            Discover electronics, fashion, home goods, and more — with a storefront
                            built on the MERN stack, ready to run locally or deploy.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                to="/shop"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 font-bold text-lg hover:opacity-95 shadow-lg shadow-accent-violet/20"
                            >
                                Browse shop
                                <span aria-hidden>→</span>
                            </Link>
                            <a
                                href="#categories"
                                className="inline-flex items-center px-8 py-4 rounded-2xl border border-slate-300 text-slate-700 hover:bg-white"
                            >
                                Explore categories
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-slate-200 bg-gradient-to-br from-accent-violet/20 to-accent-mint/10 blur-3xl pointer-events-none"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                </div>
            </section>

            <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Shop by category</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                to={`/shop?category=${encodeURIComponent(cat)}`}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl glass border border-slate-200 hover:border-accent-violet/50 transition-colors group h-full min-h-[140px]"
                            >
                                <span className="text-4xl mb-2 group-hover:animate-float">
                                    {categoryMeta[cat] || '📦'}
                                </span>
                                <span className="text-sm font-medium text-center text-slate-700">{cat}</span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <div className="flex items-end justify-between gap-4 mb-10">
                    <div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold">Featured picks</h2>
                        <p className="text-slate-500 mt-2">Hand-picked highlights from every aisle.</p>
                    </div>
                    <Link to="/shop" className="text-accent-mint text-sm font-medium hover:underline shrink-0">
                        View all →
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {featured.map((p, i) => (
                        <ProductCard key={p._id} product={p} index={i} />
                    ))}
                </div>
                {featured.length === 0 && (
                    <p className="text-slate-500 text-center py-12">
                        No products yet. Start the API and run{' '}
                        <code className="text-accent-violet">GET /api/seed/all</code> to seed the database.
                    </p>
                )}
            </section>
        </div>
    );
}
