import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toMediaUrl } from '../utils/mediaUrl';

export default function ProductCard({ product, index = 0 }) {
    const safeProduct = product || {};
    const productId = safeProduct._id || '';
    const productName = safeProduct.name || 'Unnamed product';
    const productDescription = safeProduct.description || 'No description available.';
    const productImage = toMediaUrl(safeProduct.image) || 'https://placehold.co/600x750/0f172a/94a3b8?text=No+Image';
    const productCategory = safeProduct.category || 'Uncategorized';
    const productPrice = Number(safeProduct.price);
    const priceText = Number.isFinite(productPrice) ? productPrice.toFixed(2) : '0.00';
    const productRating = Number(safeProduct.rating);
    const ratingText = Number.isFinite(productRating) ? productRating.toFixed(1) : '0.0';

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
            className="group rounded-xl overflow-hidden glass border border-slate-200 hover:border-accent-violet/40 transition-colors"
        >
            <Link to={productId ? `/product/${productId}` : '/shop'} className="block">
                <div className="aspect-square overflow-hidden bg-slate-100 relative">
                    <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-55" />
                    {safeProduct.featured && (
                        <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-1 rounded-md bg-accent-gold/90 text-ink-950">
                            Featured
                        </span>
                    )}
                    <span className="absolute bottom-2 left-2 text-[11px] text-accent-mint font-medium">
                        {productCategory}
                    </span>
                </div>
                <div className="p-3">
                    <h3 className="font-display font-semibold text-sm text-slate-900 group-hover:text-accent-violet transition-colors line-clamp-2">
                        {productName}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{productDescription}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-base font-bold text-slate-900">${priceText}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            ★ {ratingText}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
}
