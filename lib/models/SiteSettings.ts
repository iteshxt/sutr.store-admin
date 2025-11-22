import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
    {
        maintenance: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one document exists
SiteSettingsSchema.pre('save', async function (next) {
    const count = await mongoose.model('SiteSettings').countDocuments();
    if (this.isNew && count > 0) {
        throw new Error('Only one site settings document should exist');
    }
    next();
});

export const SiteSettings =
    mongoose.models.SiteSettings ||
    mongoose.model('SiteSettings', SiteSettingsSchema);
