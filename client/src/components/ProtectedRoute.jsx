import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, admin }) {
    const { user, loading } = useAuth();
    const loc = useLocation();

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center text-slate-400">
                Loading…
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: loc }} replace />;
    }
    if (admin && !user.isAdmin) {
        return <Navigate to="/" replace />;
    }
    return children;
}
