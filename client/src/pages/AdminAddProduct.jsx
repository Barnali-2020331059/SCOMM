import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Books'];

const FIELD = 'w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:border-accent-mint/50 transition-all';
const LABEL = 'block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2';

const EMPTY = {
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    countInStock: '',
    featured: false,
};

export default function AdminAddProduct() {
    const navigate = useNavigate();
    const primaryRef = useRef();
    const galleryRef = useRef();

    const [form, setForm] = useState(EMPTY);
    const [primaryFile, setPrimaryFile] = useState(null);       // File object
    const [primaryPreview, setPrimaryPreview] = useState(null); // blob URL
    const [galleryFiles, setGalleryFiles] = useState([]);       // File[]
    const [galleryPreviews, setGalleryPreviews] = useState([]); // blob URLs
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
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
        if (errors.image) setErrors((p) => ({ ...p, image: null }));
    };

    const handleGalleryImages = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        // Cap total gallery at 5
        const combined = [...galleryFiles, ...files].slice(0, 5);
        setGalleryFiles(combined);
        setGalleryPreviews(combined.map((f) => URL.createObjectURL(f)));
    };

    const removeGalleryImage = (index) => {
        setGalleryFiles((p) => p.filter((_, i) => i !== index));
        setGalleryPreviews((p) => p.filter((_, i) => i !== index));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = 'Valid price is required';
        if (!form.category) e.category = 'Category is required';
        if (!primaryFile) e.image = 'Primary image is required';
        if (form.countInStock === '' || isNaN(form.countInStock) || Number(form.countInStock) < 0)
            e.countInStock = 'Valid stock count is required';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        const shouldCreate = window.confirm('Create this product now?');
        if (!shouldCreate) return;

        setSubmitting(true);
        try {
            // Use FormData to send files + fields together
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description);
            fd.append('price', Number(form.price));
            fd.append('category', form.category);
            fd.append('brand', form.brand);
            fd.append('countInStock', Number(form.countInStock));
            fd.append('featured', form.featured);
            fd.append('image', primaryFile);                        // primary
            galleryFiles.forEach((f) => fd.append('images', f));   // gallery

            await api.post('/products', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast('Product created successfully!');
            setTimeout(() => navigate('/shop'), 1200);
        } catch (err) {
            const serverMessage =
                err.response?.data?.message || err.response?.data?.error || 'Failed to create product';
            showToast(serverMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
                            toast.type === 'error'
                                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                                : 'bg-accent-mint/20 border-accent-mint/30 text-accent-mint'
                        }`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint mb-1">Admin</p>
                    <h1 className="text-3xl font-display font-bold text-white">Add New Product</h1>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden"
                >
                    {/* ── Primary image upload ── */}
                    <div
                        onClick={() => primaryRef.current?.click()}
                        className={`relative w-full h-52 cursor-pointer group overflow-hidden border-b border-white/8 flex items-center justify-center transition-colors ${
                            errors.image ? 'bg-red-500/5' : 'bg-white/5 hover:bg-white/8'
                        }`}
                    >
                        {primaryPreview ? (
                            <>
                                <img src={primaryPreview} alt="primary preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white bg-black/50 px-3 py-1.5 rounded-lg">
                                        Change image
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                                <span className="text-4xl">📷</span>
                                <p className="text-sm font-medium">Click to upload primary image</p>
                                <p className="text-xs">JPG, PNG, WEBP — max 3MB</p>
                                {errors.image && <p className="text-xs text-red-400 mt-1">{errors.image}</p>}
                            </div>
                        )}
                        {form.featured && (
                            <span className="absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-accent-violet/30 text-accent-violet border border-accent-violet/30">
                                Featured
                            </span>
                        )}
                    </div>
                    <input ref={primaryRef} type="file" accept="image/*" onChange={handlePrimaryImage} className="hidden" />

                    <div className="px-8 py-6 space-y-5">

                        {/* ── Gallery images ── */}
                        <div>
                            <label className={LABEL}>Gallery images <span className="normal-case text-slate-600">(up to 5, shown in product detail)</span></label>
                            <div className="flex flex-wrap gap-3">
                                {galleryPreviews.map((src, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                                        <img src={src} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(i)}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {galleryPreviews.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => galleryRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border border-dashed border-white/20 hover:border-accent-mint/40 flex items-center justify-center text-slate-500 hover:text-accent-mint transition-colors text-2xl"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                            <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryImages} className="hidden" />
                        </div>

                        {/* ── Name ── */}
                        <div>
                            <label className={LABEL}>Product name *</label>
                            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Aurora Noise-Canceling Headphones" className={`${FIELD} ${errors.name ? 'border-red-500/50' : ''}`} />
                            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                        </div>

                        {/* ── Description ── */}
                        <div>
                            <label className={LABEL}>Description *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Short product description…" rows={3} className={`${FIELD} resize-none ${errors.description ? 'border-red-500/50' : ''}`} />
                            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
                        </div>

                        {/* ── Price + Stock ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Price (USD) *</label>
                                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" className={`${FIELD} ${errors.price ? 'border-red-500/50' : ''}`} />
                                {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
                            </div>
                            <div>
                                <label className={LABEL}>Stock qty *</label>
                                <input name="countInStock" type="number" min="0" step="1" value={form.countInStock} onChange={handleChange} placeholder="0" className={`${FIELD} ${errors.countInStock ? 'border-red-500/50' : ''}`} />
                                {errors.countInStock && <p className="mt-1 text-xs text-red-400">{errors.countInStock}</p>}
                            </div>
                        </div>

                        {/* ── Category + Brand ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Category *</label>
                                <select name="category" value={form.category} onChange={handleChange} className={`${FIELD} ${errors.category ? 'border-red-500/50' : ''}`}>
                                    <option value="" disabled className="bg-white text-slate-800">Select category</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c} className="bg-white text-slate-800">{c}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category}</p>}
                            </div>
                            <div>
                                <label className={LABEL}>Brand</label>
                                <input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Aurora Audio" className={FIELD} />
                            </div>
                        </div>

                        {/* ── Featured toggle ── */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="sr-only" />
                                <div className={`w-10 h-6 rounded-full border transition-colors ${form.featured ? 'bg-accent-mint/30 border-accent-mint/50' : 'bg-white/5 border-white/10'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${form.featured ? 'translate-x-4 bg-accent-mint' : 'translate-x-0 bg-slate-500'}`} />
                                </div>
                            </div>
                            <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Mark as featured product</span>
                        </label>

                        {/* ── Actions ── */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const shouldLeave = window.confirm('Discard changes and go back?');
                                    if (!shouldLeave) return;
                                    navigate(-1);
                                }}
                                className="text-sm px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-ink-950 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                                {submitting && <span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />}
                                {submitting ? 'Creating…' : 'Create product'}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
