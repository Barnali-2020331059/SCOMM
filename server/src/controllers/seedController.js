const data = require('../data');
const User = require('../models/userModel');
const Product = require('../models/productModel');

const seedUser = async (req, res) => {
    try {
        await User.deleteMany({});
        for (const u of data.users) {
            await User.create(u);
        }
        const users = await User.find({}).select('-password');
        return res.status(201).json(users);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const seedProducts = async (req, res) => {
    try {
        await Product.deleteMany({});
        for (const p of data.products) {
            await Product.create(p);
        }
        const products = await Product.find({});
        return res.status(201).json(products);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const seedAll = async (req, res) => {
    try {
        await User.deleteMany({});
        await Product.deleteMany({});
        for (const u of data.users) {
            await User.create(u);
        }
        for (const p of data.products) {
            await Product.create(p);
        }
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        return res.status(201).json({
            message: 'Database seeded',
            users: userCount,
            products: productCount,
        });
    } catch (error) {
        console.error('SEED ERROR:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = { seedUser, seedProducts, seedAll };