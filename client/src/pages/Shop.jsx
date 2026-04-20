import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategories, getProducts } from '../api';
import ProductCard from '../components/ProductCard';

export default function Shop() {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || 'all';
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const page = Number(searchParams.get('page')) || 1;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    getCategories(),
                    getProducts({
                        category: category === 'all' ? undefined : category,
                        search: searchParams.get('search') || undefined,
                        page,
                        limit: 12,
                    }),
                ]);
                if (!cancelled) {
                    setCategories(Array.isArray(catRes) ? catRes : []);
                    setProducts(Array.isArray(prodRes?.products) ? prodRes.products : []);
                    setPagination(
                        prodRes?.pagination && typeof prodRes.pagination === 'object'
                            ? prodRes.pagination
                            : { page: 1, pages: 1, total: 0 }
                    );
                }
            } catch {
                if (!cancelled) {
                    setProducts([]);
                    setPagination({ page: 1, pages: 1, total: 0 });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [category, page, searchParams]);

    const setCategory = (c) => {
        const next = new URLSearchParams(searchParams);
        if (c === 'all') next.delete('category');
        else next.set('category', c);
        next.delete('page');
        setSearchParams(next);
    };

    const submitSearch = (e) => {
        e.preventDefault();
        const next = new URLSearchParams(searchParams);
        if (search.trim()) next.set('search', search.trim());
        else next.delete('search');
        next.delete('page');
        setSearchParams(next);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display text-3xl md:text-4xl font-bold mb-2"
            >
                Shop
            </motion.h1>
            <p className="text-slate-500 mb-10">Filter by category or search the catalog.</p>

            <form onSubmit={submitSearch} className="mb-8 flex gap-3 flex-col sm:flex-row">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="flex-1 px-4 py-3 rounded-xl bg-ink-800 border border-white/10 focus:border-accent-violet outline-none text-white placeholder:text-slate-600"
                />
                <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 font-medium"
                >
                    Search
                </button>
            </form>

            <div className="flex flex-wrap gap-2 mb-10">
                <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        category === 'all'
                            ? 'bg-accent-violet text-ink-950'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                >
                    All
                </button>
                {categories.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            category === c
                                ? 'bg-accent-mint text-ink-950'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-slate-500">Loading products…</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map((p, i) => (
                            <ProductCard key={p._id} product={p} index={i} />
                        ))}
                    </div>
                    {products.length === 0 && (
                        <p className="text-slate-500 py-16 text-center">No products match your filters.</p>
                    )}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center gap-2 mt-12">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                                const next = new URLSearchParams(searchParams);
                                next.set('page', String(p));
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setSearchParams(next)}
                                        className={`w-10 h-10 rounded-lg font-medium ${
                                            p === page
                                                ? 'bg-accent-violet text-ink-950'
                                                : 'bg-white/5 border border-white/10'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
