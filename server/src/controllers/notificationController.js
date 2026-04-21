const Order = require('../models/orderModel');

// In-memory store of connected admin SSE clients
const adminClients = new Map();

// Register an admin SSE connection
const streamNotifications = async (req, res) => {
    const userId = String(req.user._id);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Heartbeat every 25s to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 25000);

    adminClients.set(userId, res);
    console.log(`[SSE] Admin ${userId} connected. Total: ${adminClients.size}`);

    // Send connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // ✅ Send last 20 orders as "catch-up" so admin sees orders placed while offline
    try {
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', 'name email');

        const catchup = recentOrders.map((o) => ({
            _id: String(o._id),
            totalPrice: o.totalPrice,
            itemCount: o.orderItems?.length || 0,
            status: o.status,
            isPaid: o.isPaid,
            userName: o.user?.name || 'Guest',
            createdAt: o.createdAt,
        }));

        res.write(`data: ${JSON.stringify({ type: 'catchup', orders: catchup })}\n\n`);
    } catch (err) {
        console.warn('[SSE] Failed to send catchup orders:', err.message);
    }

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        adminClients.delete(userId);
        console.log(`[SSE] Admin ${userId} disconnected. Total: ${adminClients.size}`);
    });
};

// Broadcast a new order event to ALL connected admin clients
const broadcastNewOrder = (order) => {
    if (adminClients.size === 0) return;

    const payload = JSON.stringify({
        type: 'new_order',
        order: {
            _id: String(order._id),
            totalPrice: order.totalPrice,
            itemCount: order.orderItems?.length || 0,
            status: order.status,
            isPaid: order.isPaid,
            userName: order.user?.name || '',
            createdAt: order.createdAt || new Date(),
        },
    });

    for (const [uid, res] of adminClients.entries()) {
        try {
            res.write(`data: ${payload}\n\n`);
        } catch (err) {
            console.warn(`[SSE] Failed to send to admin ${uid}:`, err.message);
            adminClients.delete(uid);
        }
    }
};

module.exports = { streamNotifications, broadcastNewOrder };