import mongoose, { Schema, Model } from 'mongoose';
import { Product } from '@/types';

// Sub-schema for product details (fields shown in "Additional Information" tab)
const productDetailsSchema = new Schema({
    color: { type: String, trim: true },           // e.g., "White", "Black" - Dynamic from DB
    fit: { type: String, trim: true },             // e.g., "Oversized", "Regular Fit" - Dynamic from DB
    fabric: { type: String, trim: true },          // e.g., "100% Cotton" - Dynamic from DB
    neck: { type: String, trim: true },            // e.g., "Round Neck", "V-Neck" - Dynamic from DB
}, { _id: false });

// Note: Wash instructions and Care Instructions are hardcoded in the frontend

const productSchema = new Schema<Product>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        salePrice: {
            type: Number,
            min: 0,
        },
        images: {
            type: [String],
            required: true,
            default: [],
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        subcategory: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        sizes: {
            type: [String],
            required: true,
            default: [],
        },
        colors: {
            type: [String],
            required: true,
            default: [],
        },
        inStock: {
            type: Boolean,
            required: true,
            default: true,
        },
        stock: {
            type: Number,
            min: 0,
        },
        featured: {
            type: Boolean,
            default: false,
        },
        // Product Details for "Additional Information" tab
        productDetails: {
            type: productDetailsSchema,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
// Note: slug index is already created via unique: true in the schema definition

const ProductModel: Model<Product> =
    mongoose.models.Product || mongoose.model<Product>('Product', productSchema);

export default ProductModel;
