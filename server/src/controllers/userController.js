const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { successResponse } = require('./responseController');
const findWithId = require('../services/findItem');
const deleteImage = require('../helper/deleteImage');
const { createJSONWebToken } = require('../helper/jsonwebtoken');
const { jwtActivationKey, clientURL, jwtSecret } = require('../secret');
const { authenticate } = require('../middleware/auth');
const emailWithNodeMailer = require('../helper/email');
const jwt = require('jsonwebtoken');

const createEmailVerificationToken = (user) =>
    createJSONWebToken(
        { id: user._id.toString(), email: user.email, purpose: 'verify-email' },
        jwtSecret,
        '30m',
    );

const sendVerificationEmail = async (user) => {
    const token = createEmailVerificationToken(user);
    const verifyUrl = `${clientURL}/verify-email?token=${encodeURIComponent(token)}`;
    const emailData = {
        email: user.email,
        subject: 'Verify your SCOMM account',
        html: `
            <h2>Hello ${user.name},</h2>
            <p>Please verify your email to activate your account.</p>
            <p><a href="${verifyUrl}" target="_blank" rel="noreferrer">Verify Email</a></p>
            <p>If you did not create this account, you can ignore this message.</p>
        `,
    };
    await emailWithNodeMailer(emailData);
};

const getUsers= async (req, res, next) => {
    try {
        const search = req.query.search || "";
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;

        const searchRegExp = new RegExp('.*' + search + '.*', 'i');
        const filter = {
            isAdmin : { $ne: true},
            $or : [
                {name: {$regex: searchRegExp}},
                {email: {$regex: searchRegExp}},
                {phone: {$regex: searchRegExp}},
            ]
        }; 
        const options = {password : 0};
        const users = await User.find(filter, options).limit(limit).skip((page-1)*limit);
        const count = await User.find(filter).countDocuments();

        if(!users) throw createError(404, "users not found");

        return successResponse(
            res,
            {
                status: 200,
                message: "Users succesfully returned",
                payload: {
                    users,
                    pagination: {
                        totalpages: Math.ceil(count/limit),
                        currentPage: page,
                        previousPage: page-1>0 ? page-1 : null,
                        nextPage : page+1<= Math.ceil(count/limit) ? page+1 : null,
                    },
                },
            });
    } catch (error) {
        next(error);
    }
};


const getUserById= async (req, res, next) => {
    try {
        const id=req.params.id;
        const options = {password: 0};
        const user= await findWithId(User,id,options);

        return successResponse(res,
            {
                status: 200,
                message: "User is found",
                payload: {
                    user,
                },
            });
    } catch (error) {
        next(error);
    }
};

const deleteUserById= async (req, res, next) => {
    try {
        const id=req.params.id;
        const options = {password: 0};
        const user= await findWithId(User,id,options);

        if(user.isAdmin) {
            throw createError(404, 'Admin user cannot be deleted');
        }
        const userImagePath= user.image;

        deleteImage(userImagePath);

        await User.findOneAndDelete({
            _id: id,
            isAdmin: false,
        });

        return successResponse(res,
            {
                status: 200,
                message: "User is successfully deleted",
            });
    } catch (error) {
        next(error);
    }
};

const processRegister = async (req, res, next) => registerUser(req, res, next);


const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, phone, address } = req.body;
        if (!name || !email || !password || !phone || !address) {
            throw createError(400, 'Name, email, password, phone, and address are required');
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser?.isEmailVerified) {
            throw createError(409, 'Email already registered. Please sign in.');
        }
        if (existingUser && !existingUser.isEmailVerified) {
            existingUser.name = name;
            existingUser.password = password;
            existingUser.phone = phone;
            existingUser.address = address;
            await existingUser.save();
            await sendVerificationEmail(existingUser);
            return successResponse(res, {
                status: 200,
                message: 'Verification email resent. Please verify your email before login.',
                payload: { email: existingUser.email, requiresVerification: true },
            });
        }
        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            phone,
            address,
            isEmailVerified: false,
        });
        await sendVerificationEmail(user);
        return successResponse(res, {
            status: 201,
            message: 'Account created. Please verify your email before signing in.',
            payload: {
                email: user.email,
                requiresVerification: true,
            },
        });
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw createError(400, 'Email and password are required');
        }
        let user = await User.findOne({ email }).select('+password');
        // Backward-compat: migrate old seeded admin email on first login attempt.
        if (!user && email.toLowerCase() === 'bssshoumi@gmail.com') {
            user = await User.findOne({ email: 'mehedi@example.com' }).select('+password');
            if (user) {
                user.email = 'bssshoumi@gmail.com';
                await user.save();
            }
        }
        if (!user) {
            throw createError(401, 'Invalid email or password');
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw createError(401, 'Invalid email or password');
        }
        if (!user.isEmailVerified) {
            throw createError(403, 'Please verify your email before signing in.');
        }
        if (user.isBanned) {
            throw createError(403, 'Account is suspended');
        }
        const token = createJSONWebToken(
            { id: user._id.toString(), email: user.email, isAdmin: user.isAdmin },
            jwtSecret,
            '7d',
        );
        return successResponse(res, {
            status: 200,
            message: 'Signed in',
            payload: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    isEmailVerified: user.isEmailVerified,
                    address: user.address,
                    phone: user.phone,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const getMe = [
    authenticate,
    async (req, res, next) => {
        try {
            return successResponse(res, {
                status: 200,
                message: 'Profile',
                payload: { user: req.user },
            });
        } catch (error) {
            next(error);
        }
    },
];

const activateUserAccount= async(req, res, next)=>{
    try {
        const token = req.body.token;
        if(!token)
        {
            throw createError(404,'Token not found');
        }
        try {
            
            const decoded = jwt.verify(token, jwtSecret);
            if (decoded.purpose !== 'verify-email') {
                throw createError(401, 'Invalid verification token');
            }
            const user = await User.findOne({ _id: decoded.id, email: decoded.email });
            if (!user) throw createError(404, 'User not found');
            if (user.isEmailVerified) {
                return successResponse(res, {
                    status: 200,
                    message: 'Email already verified. You can sign in.',
                });
            }
            user.isEmailVerified = true;
            await user.save();
            return successResponse(res, {
                status: 200,
                message: 'Email verified successfully. You can sign in now.',
            });
            } catch (error) {
                if(error.name == 'TokenExpiredError')
                {
                    throw createError(401, 'Token has expired');
                }
                else if(error.name=='JsonWebTokenError')
                {
                    throw createError(401, 'Invalid Token');
                }
                else {
                    throw error;
                }
            }
    } catch (error) {
        next(error);
    }
}

const resendVerificationEmail = async (req, res, next) => {
    try {
        const emailFromBody = String(req.body?.email || '').trim().toLowerCase();
        let user = null;
        if (req.user?._id) {
            user = await User.findById(req.user._id);
        } else if (emailFromBody) {
            user = await User.findOne({ email: emailFromBody });
        }
        if (!user) throw createError(404, 'User not found');
        if (user.isEmailVerified) {
            return successResponse(res, {
                status: 200,
                message: 'Email is already verified.',
            });
        }
        await sendVerificationEmail(user);
        return successResponse(res, {
            status: 200,
            message: 'Verification email sent.',
        });
    } catch (error) {
        next(error);
    }
};


const updateMe = async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, address },
            { new: true, runValidators: true }
        ).select('-password');
        return successResponse(res, {
            status: 200,
            message: 'Profile updated',
            payload: { user },
        });
    } catch (error) {
        next(error);
    }
};
 
const updateMyImage = async (req, res, next) => {
    try {
        if (!req.file) throw createError(400, 'No image provided');
        const imagePath = `/images/users/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { image: imagePath },
            { new: true }
        ).select('-password');
        return successResponse(res, {
            status: 200,
            message: 'Profile image updated',
            payload: { user },
        });
    } catch (error) {
        next(error);
    }
};

module.exports={
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
};