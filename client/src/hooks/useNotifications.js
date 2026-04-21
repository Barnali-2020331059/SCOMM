import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const MAX_NOTIFICATIONS = 50;

// Per-admin storage key so different admins don't share notifications
const getStorageKey = (user) =>
    user?.email ? `scomm_notifications_${user.email}` : null;

const loadFromStorage = (key) => {
    if (!key) return { notifications: [], unreadCount: 0 };
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { notifications: [], unreadCount: 0 };
        return JSON.parse(raw);
    } catch {
        return { notifications: [], unreadCount: 0 };
    }
};

const saveToStorage = (key, notifications, unreadCount) => {
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify({ notifications, unreadCount }));
    } catch { /* ignore */ }
};

export function useNotifications() {
    const { user } = useAuth();
    const storageKey = getStorageKey(user);

    // Load initial state from localStorage
    const [state, setState] = useState(() => loadFromStorage(storageKey));
    const stateRef = useRef(state);
    stateRef.current = state;

    // Reload from storage when user changes (login/logout/switch)
    useEffect(() => {
        const loaded = loadFromStorage(storageKey);
        setState(loaded);
    }, [storageKey]);

    // Persist to localStorage whenever state changes
    useEffect(() => {
        saveToStorage(storageKey, state.notifications, state.unreadCount);
    }, [state, storageKey]);

    // Add a single new notification (deduplicate by orderId)
    const addNotification = useCallback((notification) => {
        setState((prev) => {
            const alreadyExists = prev.notifications.some((n) => n.id === notification.id);
            if (alreadyExists) return prev;
            const updated = [notification, ...prev.notifications].slice(0, MAX_NOTIFICATIONS);
            return { notifications: updated, unreadCount: prev.unreadCount + 1 };
        });
    }, []);

    // Merge catchup orders — add any that aren't already stored, don't increment unread
    const mergeCatchup = useCallback((orders) => {
        setState((prev) => {
            const existingIds = new Set(prev.notifications.map((n) => n.id));
            const newOnes = orders
                .filter((o) => !existingIds.has(o._id))
                .map((o) => ({
                    id: o._id,
                    orderId: o._id,
                    totalPrice: o.totalPrice,
                    itemCount: o.itemCount,
                    status: o.status,
                    isPaid: o.isPaid,
                    userName: o.userName || '',
                    createdAt: o.createdAt,
                    // catchup orders are "read" already — don't bump badge
                    fromCatchup: true,
                }));

            if (!newOnes.length) return prev;

            const merged = [...prev.notifications, ...newOnes]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, MAX_NOTIFICATIONS);

            // Don't add to unreadCount for catchup orders
            return { notifications: merged, unreadCount: prev.unreadCount };
        });
    }, []);

    const markAllRead = useCallback(() => {
        setState((prev) => ({ ...prev, unreadCount: 0 }));
    }, []);

    const clearAll = useCallback(() => {
        setState({ notifications: [], unreadCount: 0 });
    }, []);

    // SSE connection
    useEffect(() => {
        if (!user?.isAdmin) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        let active = true;
        let retryTimeout = null;

        const connect = async () => {
            try {
                const response = await fetch('/api/notifications/stream', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'text/event-stream',
                    },
                });

                if (!response.ok || !active) return;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (active) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // keep incomplete line

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'new_order') {
                                addNotification({
                                    id: data.order._id,
                                    orderId: data.order._id,
                                    totalPrice: data.order.totalPrice,
                                    itemCount: data.order.itemCount,
                                    status: data.order.status,
                                    isPaid: data.order.isPaid,
                                    userName: data.order.userName || '',
                                    createdAt: data.order.createdAt,
                                    fromCatchup: false,
                                });
                            }

                            if (data.type === 'catchup' && Array.isArray(data.orders)) {
                                mergeCatchup(data.orders);
                            }
                        } catch { /* ignore parse errors */ }
                    }
                }
            } catch {
                if (!active) return;
                // Retry after 5s on connection error
                retryTimeout = setTimeout(() => { if (active) connect(); }, 5000);
            }
        };

        connect();

        return () => {
            active = false;
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, [user, addNotification, mergeCatchup]);

    return {
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        markAllRead,
        clearAll,
    };
}