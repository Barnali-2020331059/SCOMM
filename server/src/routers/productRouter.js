const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    listCategories,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// Multer — saves to public/images/products/
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, '../../public/images/products')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const prefix = file.fieldname === 'image' ? 'primary' : 'gallery';
        cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 3MB per file
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const valid =
            allowed.test(path.extname(file.originalname).toLowerCase()) &&
            allowed.test(file.mimetype);
        valid ? cb(null, true) : cb(new Error('Only images allowed (jpeg, jpg, png, webp)'));
    },
});

// Accept one 'image' (primary) + up to 5 'images' (gallery)
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
]);

const router = express.Router();

router.get('/categories', listCategories);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, requireAdmin, uploadFields, createProduct);
router.put('/:id', authenticate, requireAdmin, uploadFields, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

module.exports = router;