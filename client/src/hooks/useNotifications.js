import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const MAX_NOTIFICATIONS = 20;

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
        setUnreadCount((c) => c + 1);
    }, []);

    const markAllRead = useCallback(() => setUnreadCount(0), []);
    const clearAll = useCallback(() => { setNotifications([]); setUnreadCount(0); }, []);

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
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.type === 'new_order') {
                                    addNotification({
                                        id: data.order._id,
                                        orderId: data.order._id,
                                        totalPrice: data.order.totalPrice,
                                        itemCount: data.order.itemCount,
                                        status: data.order.status,
                                        createdAt: data.order.createdAt,
                                    });
                                }
                            } catch { /* ignore parse errors */ }
                        }
                    }
                }
            } catch {
                if (!active) return;
                // Retry after 5s on error
                retryTimeout = setTimeout(() => { if (active) connect(); }, 5000);
            }
        };

        connect();

        return () => {
            active = false;
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, [user, addNotification]);

    return { notifications, unreadCount, markAllRead, clearAll };
}