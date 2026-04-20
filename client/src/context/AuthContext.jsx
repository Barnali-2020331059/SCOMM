import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, loginUser, registerUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const u = await getMe();
            setUser(u);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const { token, user: u } = await loginUser({ email, password });
        localStorage.setItem('token', token);
        setUser(u);
        return u;
    };

    const register = async (body) => {
        const payload = await registerUser(body);
        return payload;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            refreshUser: loadUser,
        }),
        [user, loading, loadUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
