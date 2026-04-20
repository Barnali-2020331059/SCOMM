import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { toMediaUrl } from '../utils/mediaUrl';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Books'];
const FIELD = 'w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:border-accent-mint/50 transition-all';
const LABEL = 'block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2';

// ─── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({ product, onClose, onSaved }) {
    const primaryRef = useRef();
    const galleryRef = useRef();

    const [form, setForm] = useState({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        brand: product.brand || '',
        countInStock: product.countInStock ?? '',
        featured: product.featured || false,
    });
    const [primaryFile, setPrimaryFile] = useState(null);
    const [primaryPreview, setPrimaryPreview] = useState(
        product.image ? toMediaUrl(product.image) : null
    );
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState(
        product.images?.map((img) => toMediaUrl(img)) || []
    );
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
    };

    const handlePrimaryImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPrimaryFile(file);
        setPrimaryPreview(URL.createObjectURL(file));
    };

    const handleGalleryImages = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const combined = [...galleryFiles, ...files].slice(0, 5);
        setGalleryFiles(combined);
        setGalleryPreviews(combined.map((f) => f instanceof File ? URL.createObjectURL(f) : f));
    };

    const removeGalleryImage = (index) => {
        setGalleryFiles((p) => p.filter((_, i) => i !== index));
        setGalleryPreviews((p) => p.filter((_, i) => i !== index));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = 'Valid price required';
        if (!form.category) e.category = 'Category is required';
        if (form.countInStock === '' || isNaN(form.countInStock) || Number(form.countInStock) < 0)
            e.countInStock = 'Valid stock count required';
        return e;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description);
            fd.append('price', Number(form.price));
            fd.append('category', form.category);
            fd.append('brand', form.brand);
            fd.append('countInStock', Number(form.countInStock));
            fd.append('featured', form.featured);
            if (primaryFile) fd.append('image', primaryFile);
            galleryFiles.filter((f) => f instanceof File).forEach((f) => fd.append('images', f));

            await api.put(`/products/${product._id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSaved();
            onClose();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update product', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        // Full-screen overlay — uses flex column so footer is always pinned
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
                            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                        }`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                // KEY FIX: flex column with fixed max height — header + footer pinned, only middle scrolls
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col"
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
                {/* ── Fixed header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint mb-0.5">Admin · Edit</p>
                        <h2 className="text-lg font-bold text-slate-900 truncate max-w-sm">{product.name}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                        ×
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

                    {/* Primary image */}
                    <div>
                        <label className={LABEL}>Primary image</label>
                        <div
                            onClick={() => primaryRef.current?.click()}
                            className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-accent-mint/50 cursor-pointer group transition-colors flex items-center justify-center bg-slate-50"
                        >
                            {primaryPreview ? (
                                <>
                                    <img src={primaryPreview} alt="preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-sm font-semibold text-white">Change image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <p className="text-3xl mb-1">📷</p>
                                    <p className="text-xs">Click to upload</p>
                                </div>
                            )}
                        </div>
                        <input ref={primaryRef} type="file" accept="image/*" onChange={handlePrimaryImage} className="hidden" />
                    </div>

                    {/* Gallery */}
                    <div>
                        <label className={LABEL}>Gallery images <span className="normal-case text-slate-400">(up to 5)</span></label>
                        <div className="flex flex-wrap gap-3">
                            {galleryPreviews.map((src, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeGalleryImage(i)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                        ×
                                    </button>
                                </div>
                            ))}
                            {galleryPreviews.length < 5 && (
                                <button type="button" onClick={() => galleryRef.current?.click()}
                                    className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-accent-mint/50 flex items-center justify-center text-slate-400 hover:text-accent-mint transition-colors text-2xl">
                                    +
                                </button>
                            )}
                        </div>
                        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryImages} className="hidden" />
                    </div>

                    {/* Name */}
                    <div>
                        <label className={LABEL}>Product name *</label>
                        <input name="name" value={form.name} onChange={handleChange}
                            className={`${FIELD} ${errors.name ? 'border-red-400' : ''}`} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className={LABEL}>Description *</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                            className={`${FIELD} resize-none ${errors.description ? 'border-red-400' : ''}`} />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>

                    {/* Price + Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Price (USD) *</label>
                            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange}
                                className={`${FIELD} ${errors.price ? 'border-red-400' : ''}`} />
                            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Stock qty *</label>
                            <input name="countInStock" type="number" min="0" step="1" value={form.countInStock} onChange={handleChange}
                                className={`${FIELD} ${errors.countInStock ? 'border-red-400' : ''}`} />
                            {errors.countInStock && <p className="mt-1 text-xs text-red-500">{errors.countInStock}</p>}
                        </div>
                    </div>

                    {/* Category + Brand */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Category *</label>
                            <select name="category" value={form.category} onChange={handleChange}
                                className={`${FIELD} ${errors.category ? 'border-red-400' : ''}`}>
                                <option value="" disabled>Select category</option>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Brand</label>
                            <input name="brand" value={form.brand} onChange={handleChange} className={FIELD} />
                        </div>
                    </div>

                    {/* Featured toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="sr-only" />
                            <div className={`w-10 h-6 rounded-full border transition-colors ${form.featured ? 'bg-accent-mint/30 border-accent-mint/50' : 'bg-slate-100 border-slate-200'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${form.featured ? 'translate-x-4 bg-accent-mint' : 'translate-x-0 bg-slate-400'}`} />
                            </div>
                        </div>
                        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Mark as featured</span>
                    </label>
                </div>

                {/* ── Fixed footer — always visible ── */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0 rounded-b-2xl">
                    <button type="button" onClick={onClose}
                        className="text-sm px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                        {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main AdminProducts page ──────────────────────────────────────────────────
export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/products', { params: { limit: 100 } });
            setProducts(data.payload.products || []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, []);

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeletingId(product._id);
        try {
            await api.delete(`/products/${product._id}`);
            showToast('Product deleted');
            setProducts((prev) => prev.filter((p) => p._id !== product._id));
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = products.filter((p) => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand?.toLowerCase().includes(search.toLowerCase());
        const matchCat = !categoryFilter || p.category === categoryFilter;
        return matchSearch && matchCat;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
                            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                        }`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {editingProduct && (
                <EditModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSaved={() => { loadProducts(); showToast('Product updated successfully'); }}
                />
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint mb-1">Admin</p>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Edit Products</h1>
                    <p className="text-slate-500 text-sm mt-1">{products.length} products in store</p>
                </div>
                <Link
                    to="/admin/products/new"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                    + Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or brand…"
                    className="flex-1 min-w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-accent-mint/50"
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-accent-mint/50"
                >
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-24 text-slate-400">Loading products…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-400">No products found.</div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((product) => (
                        <motion.div
                            key={product._id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
                        >
                            <div className="relative h-44 bg-slate-100 overflow-hidden">
                                {product.image ? (
                                    <img
                                        src={toMediaUrl(product.image)}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">📦</div>
                                )}
                                {product.featured && (
                                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-violet/90 text-white">
                                        Featured
                                    </span>
                                )}
                                {product.countInStock === 0 && (
                                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500/90 text-white">
                                        Out of stock
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-slate-400 mb-1">{product.category} · {product.brand}</p>
                                <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2">
                                    {product.name}
                                </p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-base font-bold text-accent-mint">
                                        ${Number(product.price).toFixed(2)}
                                    </span>
                                    <span className="text-xs text-slate-400">{product.countInStock} in stock</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct(product)}
                                        className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-accent-violet/10 hover:text-accent-violet text-slate-600 text-xs font-semibold transition-colors"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(product)}
                                        disabled={deletingId === product._id}
                                        className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === product._id ? '…' : '🗑️ Delete'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
