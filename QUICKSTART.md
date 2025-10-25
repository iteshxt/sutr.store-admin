# Quick Start - Image Upload Setup

## ⚡ 3-Minute Setup

### Step 1: Get Cloudinary Credentials (2 minutes)

1. Go to: <https://cloudinary.com/users/register/free>
2. Sign up (free, no credit card needed)
3. After login, copy from dashboard:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (click "Show" to reveal)

### Step 2: Add to .env.local (1 minute)

Create/edit `.env.local` in project root:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Step 3: Restart Server

```bash
npm run dev
```

## ✅ Test It

1. Go to: <http://localhost:3000/products/new>
2. Scroll to "Product Images" section
3. Drag & drop an image or click to upload
4. See image preview appear
5. Done! 🎉

## 📍 Where Images Go

- **Cloudinary**: Stored in `sutr-store/products` folder
- **MongoDB**: Image URLs saved in `images` array
- **Frontend**: Displayed via Next.js Image component

## Need Help?

See full guide: `docs/CLOUDINARY_SETUP.md`

---

**Total setup time: ~3 minutes**
