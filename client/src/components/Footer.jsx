import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-slate-200 mt-20 bg-white/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row gap-8 justify-between items-start sm:items-center">
                <div>
                    <p className="font-display font-bold text-lg text-slate-900">SCOMM</p>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs">
                        Curated products across electronics, fashion, home, sports, beauty, and books.
                    </p>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                    <Link to="/shop" className="hover:text-accent-violet">
                        Catalog
                    </Link>
                    <a href="#categories" className="hover:text-accent-violet">
                        Categories
                    </a>
                </div>
                <p className="text-slate-600 text-xs">© {new Date().getFullYear()} SCOMM demo store</p>
            </div>
        </footer>
    );
}
