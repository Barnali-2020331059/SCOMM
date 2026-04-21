import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const MAX_NOTIFICATIONS = 50;

const getStorageKey = (user) =>
    user?.email ? `scomm_notifications_${user.email}` : null;

// Separate key to track when admin last opened the bell
const getLastSeenKey = (user) =>
    user?.email ? `scomm_notifications_lastseen_${user.email}` : null;

const loadFromStorage = (key) => {
    if (!key) return { notifications: [] };
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { notifications: [] };
        const parsed = JSON.parse(raw);
        // Strip old unreadCount — we now compute it dynamically from lastSeen
        return { notifications: parsed.notifications || parsed || [] };
    } catch {
        return { notifications: [] };
    }
};

const saveToStorage = (key, notifications) => {
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify({ notifications }));
    } catch { /* ignore */ }
};

const loadLastSeen = (key) => {
    if (!key) return 0;
    try {
        return parseInt(localStorage.getItem(key) || '0', 10);
    } catch {
        return 0;
    }
};

const saveLastSeen = (key, ts) => {
    if (!key) return;
    try {
        localStorage.setItem(key, String(ts));
    } catch { /* ignore */ }
};

export function useNotifications() {
    const { user } = useAuth();
    const storageKey = getStorageKey(user);
    const lastSeenKey = getLastSeenKey(user);

    const [notifications, setNotifications] = useState([]);
    const [lastSeen, setLastSeen] = useState(0);

    // Load from storage when user changes
    useEffect(() => {
        const { notifications: stored } = loadFromStorage(storageKey);
        const ls = loadLastSeen(lastSeenKey);
        setNotifications(stored);
        setLastSeen(ls);
    }, [storageKey, lastSeenKey]);

    // Persist notifications when they change
    useEffect(() => {
        saveToStorage(storageKey, notifications);
    }, [notifications, storageKey]);

    // ✅ Unread count = orders newer than lastSeen timestamp
    const unreadCount = notifications.filter(
        (n) => new Date(n.createdAt).getTime() > lastSeen
    ).length;

    // Add a single live notification (from new_order SSE event)
    const addNotification = useCallback((notification) => {
        setNotifications((prev) => {
            const alreadyExists = prev.some((n) => n.id === notification.id);
            if (alreadyExists) return prev;
            return [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
    }, []);

    // Merge catchup orders — silently add historical orders without marking as unread
    // Only orders newer than lastSeen will appear in unreadCount automatically
    const mergeCatchup = useCallback((orders) => {
        setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
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
                    fromCatchup: true,
                }));

            if (!newOnes.length) return prev;

            return [...prev, ...newOnes]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, MAX_NOTIFICATIONS);
        });
    }, []);

    // Mark all read — save current timestamp as lastSeen
    const markAllRead = useCallback(() => {
        const now = Date.now();
        setLastSeen(now);
        saveLastSeen(lastSeenKey, now);
    }, [lastSeenKey]);

    const clearAll = useCallback(() => {
        setNotifications([]);
        const now = Date.now();
        setLastSeen(now);
        saveLastSeen(lastSeenKey, now);
    }, [lastSeenKey]);

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
                    buffer = lines.pop();

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
        notifications,
        unreadCount,
        markAllRead,
        clearAll,
    };
}