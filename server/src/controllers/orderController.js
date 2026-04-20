const createError = require('http-errors');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { successResponse } = require('./responseController');
const findWithId = require('../services/findItem');
const { broadcastNewOrder } = require('./notificationController');

const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderItems, shippingAddress, paymentMethod } = req.body;
        if (!orderItems?.length) {
            throw createError(400, 'No order items');
        }

        let itemsPrice = 0;
        const resolvedItems = [];

        for (const item of orderItems) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                throw createError(404, `Product ${item.product} not found`);
            }
            if (product.countInStock < item.qty) {
                throw createError(400, `Insufficient stock for ${product.name}`);
            }
            const lineTotal = product.price * item.qty;
            itemsPrice += lineTotal;
            resolvedItems.push({
                product: product._id,
                name: product.name,
                image: product.image,
                price: product.price,
                qty: item.qty,
                category: product.category,
            });
            product.countInStock -= item.qty;
            await product.save({ session });
        }

        const shippingPrice = itemsPrice > 100 ? 0 : 9.99;
        const taxPrice = Math.round(itemsPrice * 0.08 * 100) / 100;
        const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

        const [order] = await Order.create(
            [
                {
                    user: req.user._id,
                    orderItems: resolvedItems,
                    shippingAddress,
                    paymentMethod: paymentMethod || 'card',
                    itemsPrice,
                    shippingPrice,
                    taxPrice,
                    totalPrice,
                },
            ],
            { session },
        );

        await session.commitTransaction();
        session.endSession();

        // Broadcast real-time notification to all connected admins
        broadcastNewOrder(order);

        return successResponse(res, {
            status: 201,
            message: 'Order placed',
            payload: { order },
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        return successResponse(res, {
            status: 200,
            message: 'Your orders',
            payload: { orders },
        });
    } catch (e) {
        next(e);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const order = await findWithId(Order, req.params.id);
        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            throw createError(403, 'Not allowed to view this order');
        }
        return successResponse(res, {
            status: 200,
            message: 'Order found',
            payload: { order },
        });
    } catch (e) {
        next(e);
    }
};

const listOrdersAdmin = async (req, res, next) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
        return successResponse(res, {
            status: 200,
            message: 'All orders',
            payload: { orders },
        });
    } catch (e) {
        next(e);
    }
};

const markOrderPaid = async (req, res, next) => {
    try {
        const order = await findWithId(Order, req.params.id);
        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            throw createError(403, 'Not allowed');
        }
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'processing';
        await order.save();
        return successResponse(res, {
            status: 200,
            message: 'Payment recorded',
            payload: { order },
        });
    } catch (e) {
        next(e);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await findWithId(Order, req.params.id);
        order.status = status || order.status;
        if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = new Date();
        }
        await order.save();
        return successResponse(res, {
            status: 200,
            message: 'Order updated',
            payload: { order },
        });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    listOrdersAdmin,
    markOrderPaid,
    updateOrderStatus,
};