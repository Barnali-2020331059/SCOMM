const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const { defaultImagePath } = require('../secret');

const userSchema = new Schema({
    name : {
        type : String,
        required : [true, "Username is required"],
        trim : true,
        minlength : [3, "username must have 3 characters"],
        maxlength : [31, "username can't have more than 31 characters"],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: (props) => `${props.value} is not a valid email address`,
        },
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
        set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)),
    },
    image : {
        type : String,
        default : defaultImagePath,
    },
    address : {
        type: String,
        required: [true, 'Address is required'],
    },
    phone : {
        type: String,
        required: [true, 'Phone no is required'],
    },
    isAdmin : {
        type : Boolean,
        default : false,
    },
    isBanned : {
        type : Boolean,
        default : false,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
},
{timestamps : true});

const User = model('Users', userSchema);
module.exports = User;