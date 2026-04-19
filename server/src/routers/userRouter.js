const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    getUsers,
    getUserById,
    deleteUserById,
    processRegister,
    activateUserAccount,
    registerUser,
    loginUser,
    getMe,
    updateMe,
    updateMyImage,
    resendVerificationEmail,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Multer setup — saves to public/images/users
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, '../../public/images/users')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user-${req.user._id}-${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const valid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                      allowed.test(file.mimetype);
        valid ? cb(null, true) : cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
    },
});

const userRouter = express.Router();

// Auth
userRouter.post('/process-register', processRegister);
userRouter.post('/verify', activateUserAccount);
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/resend-verification', resendVerificationEmail);

// Current user
userRouter.get('/me', getMe);
userRouter.put('/me', authenticate, updateMe);
userRouter.patch('/me/image', authenticate, upload.single('image'), updateMyImage);

// Admin
userRouter.get('/', getUsers);
userRouter.get('/:id', getUserById);
userRouter.delete('/:id', deleteUserById);

module.exports = userRouter;