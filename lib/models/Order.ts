import mongoose, { Schema, Model } from 'mongoose';
import { Order, OrderItem, Address } from '@/types';

const addressSchema = new Schema<Address>({
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'US' },
    phone: String,
});

const orderItemSchema = new Schema<OrderItem>({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: String,
    color: String,
    image: String,
});

const orderSchema = new Schema<Order>(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled'],
            default: 'pending',
        },
        items: {
            type: [orderItemSchema],
            required: true,
        },
        shippingAddress: {
            type: addressSchema,
            required: true,
        },
        billingAddress: addressSchema,
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotal: {
            type: Number,
            min: 0,
        },
        tax: {
            type: Number,
            min: 0,
        },
        shipping: {
            type: Number,
            min: 0,
        },
        paymentId: {
            type: String,
            required: true,
        },
        paymentStatus: {
            type: String,
            required: true,
        },
        paymentMethod: String,
        trackingNumber: String,
        trackingLink: String,
        notes: String,
    },
    {
        timestamps: true,
    }
);

// Indexes (orderNumber already has unique:true which creates an index, no need to duplicate)
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Properly handle model creation to avoid caching issues
let OrderModel: Model<Order>;

if (mongoose.models['Order']) {
    OrderModel = mongoose.models['Order'] as Model<Order>;
} else {
    OrderModel = mongoose.model<Order>('Order', orderSchema);
}

export default OrderModel;
