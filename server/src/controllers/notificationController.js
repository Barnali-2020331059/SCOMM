// In-memory store of connected admin SSE clients
// Map of userId -> res object
const adminClients = new Map();

// Register an admin SSE connection
const streamNotifications = (req, res) => {
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

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        adminClients.delete(userId);
        console.log(`[SSE] Admin ${userId} disconnected. Total: ${adminClients.size}`);
    });
};

// Broadcast new order event to all connected admins
const broadcastNewOrder = (order) => {
    if (adminClients.size === 0) return;

    const payload = JSON.stringify({
        type: 'new_order',
        order: {
            _id: String(order._id),
            totalPrice: order.totalPrice,
            itemCount: order.orderItems?.length || 0,
            status: order.status,
            createdAt: order.createdAt || new Date(),
        },
    });

    for (const [userId, res] of adminClients.entries()) {
        try {
            res.write(`data: ${payload}\n\n`);
        } catch (err) {
            console.warn(`[SSE] Failed to send to admin ${userId}:`, err.message);
            adminClients.delete(userId);
        }
    }
};

module.exports = { streamNotifications, broadcastNewOrder };