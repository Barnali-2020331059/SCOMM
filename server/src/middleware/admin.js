const createError = require('http-errors');

const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return next(createError(403, 'Admin access required'));
    }
    next();
};

module.exports = { requireAdmin };
