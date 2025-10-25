# Cloudinary Image Upload Setup Guide

This guide will help you set up Cloudinary for image uploads in the admin dashboard.

## What is Cloudinary?

Cloudinary is a cloud-based image and video management platform that provides:

- Secure image storage
- Automatic image optimization
- Fast CDN delivery
- Image transformations (resize, crop, etc.)

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a **free account** (no credit card required)
3. Verify your email address

### 2. Get Your Credentials

1. After logging in, you'll be on the **Dashboard**
2. You'll see your account details:
   - **Cloud Name** (e.g., `dxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (hidden by default - click "Show" to reveal)

### 3. Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add your Cloudinary credentials:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

3. Replace the placeholder values with your actual credentials from step 2
4. **IMPORTANT**: Never commit `.env.local` to git (it should be in `.gitignore`)

### 4. Install Cloudinary Package

The `cloudinary` package should already be installed. If not, run:

```bash
npm install cloudinary
```

### 5. Test the Setup

1. Restart your development server:

   ```bash
   npm run dev
   ```

2. Navigate to **Products → Add New Product** or edit an existing product

3. In the **Product Images** section:
   - Click the upload area or drag and drop an image
   - The image should upload to Cloudinary
   - You'll see a preview of the uploaded image
   - The image URL will be saved to MongoDB

### 6. Verify in Cloudinary Dashboard

1. Go to [https://console.cloudinary.com/](https://console.cloudinary.com/)
2. Navigate to **Media Library**
3. You should see your uploaded images in the `sutr-store/products` folder

## How It Works

### Upload Flow

1. **Admin uploads image** → ImageUpload component
2. **File sent to API** → `/api/upload` route
3. **API uploads to Cloudinary** → Returns secure URL
4. **URL saved to database** → MongoDB stores the Cloudinary URL
5. **Image displayed** → Next.js Image component loads from Cloudinary

### Image Transformations

The upload API automatically applies these optimizations:

- **Max dimensions**: 1000x1000px
- **Quality**: Auto (Cloudinary optimizes based on content)
- **Format**: Auto (serves WebP for supported browsers)

### Example Image URL

After upload, you'll get a URL like:

```
https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/sutr-store/products/abc123.jpg
```

## Features Implemented

### ImageUpload Component

✅ **Drag & Drop**: Drag images directly onto the upload area
✅ **Multiple Upload**: Upload multiple images at once
✅ **Preview**: See thumbnail previews of uploaded images
✅ **Remove**: Delete images with hover button
✅ **Progress**: Loading indicator during upload
✅ **Validation**: Only allows image files (PNG, JPG, WEBP)

### Security

✅ **Admin Auth**: Only authenticated admins can upload
✅ **File Type Validation**: Server-side validation of image types
✅ **Size Limits**: Images optimized to reasonable dimensions
✅ **Secure URLs**: Cloudinary provides secure HTTPS URLs

## Cloudinary Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited

This is more than enough for most e-commerce stores!

## Troubleshooting

### Upload fails with "Unauthorized"

- Check that you're logged in as an admin
- Verify Firebase authentication is working

### Upload fails with "Invalid credentials"

- Double-check your Cloudinary credentials in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart your development server after updating `.env.local`

### Images don't show up

- Check the browser console for errors
- Verify the image URL in MongoDB is correct
- Ensure Next.js image domains are configured (already done in `next.config.ts`)

### Upload is slow

- Cloudinary free tier has good performance
- Large images (>10MB) may take longer to upload
- Consider compressing images before upload

## Next.js Image Configuration

The following Cloudinary domains are already configured in `next.config.ts`:

```typescript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
  },
]
```

This allows Next.js Image component to load and optimize images from Cloudinary.

## Support

- **Cloudinary Docs**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Cloudinary Support**: Available in your dashboard

---

**Ready to upload!** 🎉 Just add your credentials to `.env.local` and start uploading product images.
