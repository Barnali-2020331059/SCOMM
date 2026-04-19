const createError = require('http-errors');
const Product = require('../models/productModel');
const { successResponse, errorResponse } = require('./responseController');

const listCategories = async (req, res, next) => {
    try {
        const categories = await Product.distinct('category');
        return successResponse(res, { payload: { categories } });
    } catch (error) {
        next(error);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const { category, search, page = 1, limit = 12, featured } = req.query;
        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.max(Number(limit) || 12, 1);
        const filter = {};
        if (category) filter.category = category;
        if (featured === 'true') filter.featured = true;
        if (search) filter.name = { $regex: search, $options: 'i' };
        const skip = (pageNum - 1) * limitNum;
        const [products, total] = await Promise.all([
            Product.find(filter).skip(skip).limit(limitNum),
            Product.countDocuments(filter),
        ]);
        const pages = Math.max(Math.ceil(total / limitNum), 1);
        return successResponse(res, {
            payload: {
                products,
                pagination: {
                    page: pageNum,
                    pages,
                    total,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) throw createError(404, 'Product not found');
        return successResponse(res, { payload: { product } });
    } catch (error) {
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const { name, description, price, category, brand, countInStock, featured } = req.body;

        // Primary image — required
        if (!req.files?.image?.[0]) {
            throw createError(400, 'Primary product image is required');
        }
        const image = `/images/products/${req.files.image[0].filename}`;

        // Gallery images — optional
        const images = req.files?.images
            ? req.files.images.map((f) => `/images/products/${f.filename}`)
            : [];

        const product = await Product.create({
            name,
            description,
            price: Number(price),
            category,
            brand,
            countInStock: Number(countInStock),
            featured: featured === 'true' || featured === true,
            image,
            images,
        });

        return successResponse(res, {
            status: 201,
            message: 'Product created',
            payload: { product },
        });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const updates = { ...req.body };

        // If a new primary image was uploaded, use it
        if (req.files?.image?.[0]) {
            updates.image = `/images/products/${req.files.image[0].filename}`;
        }

        // If new gallery images were uploaded, replace the gallery
        if (req.files?.images?.length) {
            updates.images = req.files.images.map((f) => `/images/products/${f.filename}`);
        }

        if (updates.price) updates.price = Number(updates.price);
        if (updates.countInStock) updates.countInStock = Number(updates.countInStock);
        if (updates.featured !== undefined) updates.featured = updates.featured === 'true' || updates.featured === true;

        const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!product) throw createError(404, 'Product not found');

        return successResponse(res, { message: 'Product updated', payload: { product } });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) throw createError(404, 'Product not found');
        return successResponse(res, { message: 'Product deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { listCategories, getProducts, getProductById, createProduct, updateProduct, deleteProduct };