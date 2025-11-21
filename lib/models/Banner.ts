import mongoose, { Schema, Model } from 'mongoose';
import { Banner, BannerImage } from '@/types';

const bannerImageSchema = new Schema<BannerImage>(
    {
        url: {
            type: String,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const bannerSchema = new Schema<Banner>(
    {
        mobileBanners: {
            type: [bannerImageSchema],
            default: [],
        },
        desktopBanners: {
            type: [bannerImageSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

let BannerModel: Model<Banner>;

if (mongoose.models['Banner']) {
    BannerModel = mongoose.models['Banner'] as Model<Banner>;
} else {
    BannerModel = mongoose.model<Banner>('Banner', bannerSchema);
}

export default BannerModel;
