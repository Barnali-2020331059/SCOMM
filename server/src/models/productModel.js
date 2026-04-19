const { Schema, model } = require('mongoose');

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [120, 'Name is too long'],
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: {
                values: ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Books'],
                message: '{VALUE} is not a supported category',
            },
        },
        brand: {
            type: String,
            default: 'SCOMM',
            trim: true,
        },
        image: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        images: [{ type: String }],
        countInStock: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },
        rating: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        featured: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

productSchema.pre('save', async function () {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

const Product = model('Product', productSchema);
module.exports = Product;
