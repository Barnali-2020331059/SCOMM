const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/userModel');
const { jwtSecret } = require('../secret');

const authenticate = async (req, res, next) => {
    try {
        let token;
        const auth = req.headers.authorization;
        if (auth && auth.startsWith('Bearer ')) {
            token = auth.slice(7);
        }
        if (!token) {
            throw createError(401, 'Not authorized, no token');
        }
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            throw createError(401, 'User not found');
        }
        if (user.isBanned) {
            throw createError(403, 'Account is suspended');
        }
        req.user = user;
        next();
    } catch (err) {
        if (err.status) return next(err);
        next(createError(401, 'Not authorized, invalid token'));
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return next();
        }
        const token = auth.slice(7);
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isBanned) {
            req.user = user;
        }
        next();
    } catch {
        next();
    }
};

module.exports = { authenticate, optionalAuth };
