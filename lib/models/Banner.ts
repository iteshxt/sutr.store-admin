import mongoose, { Schema, Model } from 'mongoose';
import { Banner } from '@/types';

const bannerSchema = new Schema<Banner>(
    {
        bannerUrl: {
            type: String,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: 'Website Banner',
        },
        link: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Only one banner should be active at a time
bannerSchema.pre('save', async function (next) {
    if (this.isActive) {
        // Deactivate all other banners
        await mongoose.model('Banner').updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

let BannerModel: Model<Banner>;

if (mongoose.models['Banner']) {
    BannerModel = mongoose.models['Banner'] as Model<Banner>;
} else {
    BannerModel = mongoose.model<Banner>('Banner', bannerSchema);
}

export default BannerModel;
