import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
            <div
                className="fixed inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_90%_18%,rgba(14,165,233,0.16),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.12),transparent_45%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_55%,#f7fafc_100%)]"
                aria-hidden
            />
            <div
                className="fixed inset-0 bg-grid-fade bg-[length:56px_56px] pointer-events-none opacity-30"
                aria-hidden
            />
            <Navbar />
            <main className="relative flex-1 z-10">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
