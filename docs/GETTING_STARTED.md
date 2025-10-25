# 🚀 Quick Start Guide

## First Time Setup (5 minutes)

### 1. Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in these values (get from main site or create new ones):

**Firebase** (from Firebase Console):

- Go to Project Settings → General
- Copy Web API Key, Project ID, etc.

**Firebase Admin** (from Firebase Console):

- Go to Project Settings → Service Accounts
- Generate new private key
- Copy project ID, client email, and private key

**MongoDB** (from MongoDB Atlas):

- Get connection string from Atlas dashboard
- Replace `<username>` and `<password>`

**Cloudinary** (from Cloudinary Dashboard):

- Get cloud name, API key, and API secret

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Admin User

You need Firebase Admin SDK access. Create a script:

```javascript
// scripts/set-admin.js
import { adminAuth } from '../lib/firebase-admin.js';

const email = 'your-email@example.com'; // Your email

async function setAdmin() {
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for ${email}`);
    console.log('Please log out and log in again for changes to take effect');
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdmin();
```

Run it:

```bash
node --experimental-modules scripts/set-admin.js
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: <http://localhost:3000>

### 5. Login

1. Go to <http://localhost:3000/login>
2. Use your Firebase user credentials
3. You should see the dashboard

## 🎯 What to Do Next

### Test the Features

1. **Dashboard**: View stats and recent orders
2. **Products**:
   - Click "Products" in sidebar
   - Click "Add Product"
   - Fill form and create a product
3. **Orders**: View order list
4. **Customers**: View customer list

### Connect Real Data

Currently showing mock data. To connect real data:

1. Make sure MongoDB is accessible
2. Update API calls in pages to use real endpoints
3. Test CRUD operations

Example in `/app/products/page.tsx`:

```typescript
// Replace this:
setProducts([/* mock data */]);

// With this:
const response = await fetch('/api/products');
const data = await response.json();
setProducts(data.products);
```

## 📝 Common Issues

### "Unauthorized" Error

**Problem**: Can't access dashboard after login  
**Solution**: Make sure admin claim is set correctly and you've logged out/in

### Can't Connect to MongoDB

**Problem**: Connection timeout  
**Solution**:

1. Check `MONGODB_URI` in `.env.local`
2. Whitelist your IP in MongoDB Atlas
3. Check username/password are correct

### Firebase Errors

**Problem**: Authentication fails  
**Solution**:

1. Verify all `NEXT_PUBLIC_FIREBASE_*` variables
2. Check Firebase Console for errors
3. Ensure `FIREBASE_ADMIN_PRIVATE_KEY` has proper format

### Images Not Loading

**Problem**: Product images return 404  
**Solution**:

1. Check Cloudinary credentials
2. Verify `next.config.ts` has proper image domains
3. Upload test image via Cloudinary dashboard

## 🛠️ Development Workflow

### Making Changes

1. Edit files in `/app` or `/components`
2. Changes auto-reload in browser
3. Check console for errors
4. Test thoroughly before committing

### Adding New Features

1. Create new page in `/app`
2. Add route to sidebar navigation
3. Create API route if needed
4. Update types in `/types/index.d.ts`

### Testing

Before deployment:

- [ ] Login works
- [ ] Dashboard displays
- [ ] Can create products
- [ ] Can view orders
- [ ] All pages load without errors
- [ ] Mobile responsive

## 🚀 Deploying to Vercel

See `DEPLOYMENT.md` for complete guide.

Quick version:

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

## 📚 Reference Files

- `README.md` - Project overview
- `ADMIN_SETUP_GUIDE.md` - Detailed setup
- `DEPLOYMENT.md` - Production deployment
- `BUILD_SUMMARY.md` - What's been built

## 💡 Pro Tips

1. **Use the browser console**: Check for errors and API responses
2. **Check Network tab**: See API requests and responses
3. **MongoDB Compass**: Visual tool to browse database
4. **Firebase Console**: Monitor authentication and users
5. **Vercel logs**: Debug production issues

## 🆘 Need Help?

Check these first:

1. Error messages in browser console
2. Terminal output where `npm run dev` is running
3. MongoDB Atlas activity logs
4. Firebase Authentication logs

Common fixes:

- Restart dev server (`Ctrl+C` then `npm run dev`)
- Clear browser cache
- Check `.env.local` has all variables
- Verify user has admin claim

---

**Ready to build?** 🎉

Start the dev server and visit the login page!

```bash
npm run dev
```
