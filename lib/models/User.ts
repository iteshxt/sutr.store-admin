import mongoose, { Schema, Model } from 'mongoose';
import { User, Address } from '@/types';

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

const userSchema = new Schema<User>(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        avatar: String,
        addresses: {
            type: [addressSchema],
            default: [],
        },
        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer',
        },
    },
    {
        timestamps: true,
    }
);

const UserModel: Model<User> =
    mongoose.models.User || mongoose.model<User>('User', userSchema);

export default UserModel;
