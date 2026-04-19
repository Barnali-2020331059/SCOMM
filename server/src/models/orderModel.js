const { Schema, model } = require('mongoose');

const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: Number,
    qty: { type: Number, required: true, min: 1 },
    category: String,
});

const orderSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
        orderItems: [orderItemSchema],
        shippingAddress: {
            fullName: String,
            address: String,
            city: String,
            postalCode: String,
            country: String,
            phone: String,
        },
        paymentMethod: {
            type: String,
            default: 'card',
        },
        itemsPrice: { type: Number, required: true },
        shippingPrice: { type: Number, default: 0 },
        taxPrice: { type: Number, default: 0 },
        totalPrice: { type: Number, required: true },
        isPaid: { type: Boolean, default: false },
        paidAt: Date,
        isDelivered: { type: Boolean, default: false },
        deliveredAt: Date,
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

const Order = model('Order', orderSchema);
module.exports = Order;
