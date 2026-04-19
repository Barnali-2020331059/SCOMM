const express = require('express');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    listOrdersAdmin,
    markOrderPaid,
    updateOrderStatus,
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/mine', authenticate, getMyOrders);
router.get('/admin/all', authenticate, requireAdmin, listOrdersAdmin);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/pay', authenticate, markOrderPaid);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

module.exports = router;
