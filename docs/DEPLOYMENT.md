# Sutr Admin Dashboard - Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account
3. ✅ MongoDB Atlas account
4. ✅ Firebase project with Admin SDK
5. ✅ Cloudinary account

### Step 1: Push to GitHub

```bash
cd /home/petrioteer/Documents/1.Projects/sutr-admin

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Sutr Admin Dashboard"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/sutr-admin.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository (`sutr-admin`)
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables (see below)

6. Click "Deploy"

### Step 3: Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

#### Firebase Configuration

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Firebase Admin SDK

```
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**Important**: For `FIREBASE_ADMIN_PRIVATE_KEY`, make sure to:

- Wrap the entire key in double quotes
- Keep the `\n` characters (don't replace with actual newlines)
- Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers

#### MongoDB

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sutr-store?retryWrites=true&w=majority
```

#### Cloudinary

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbcDefGhiJklMnoPqrStuvWxyz
```

### Step 4: Configure Custom Domain

1. In Vercel Dashboard, go to **Domains**
2. Add custom domain: `admin.sutr.store`
3. Update DNS records (if not using Vercel DNS):
   - Type: `CNAME`
   - Name: `admin`
   - Value: `cname.vercel-dns.com`

### Step 5: MongoDB IP Whitelist

1. Go to MongoDB Atlas
2. Network Access → IP Access List
3. Add Vercel's IPs or use `0.0.0.0/0` (all IPs)

⚠️ **Security Note**: For production, whitelist specific Vercel IPs instead of `0.0.0.0/0`

### Step 6: Set Admin User

After deployment, set admin privileges for your user:

```javascript
// Run this in Firebase Functions or locally with Firebase Admin SDK
import { adminAuth } from './lib/firebase-admin';

const setAdminUser = async (email: string) => {
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for ${email}`);
  } catch (error) {
    console.error('Error setting admin claim:', error);
  }
};

// Replace with your admin email
await setAdminUser('your-admin@email.com');
```

## 🔒 Security Checklist

Before going live, ensure:

- [ ] All environment variables are set in Vercel
- [ ] MongoDB IP whitelist is configured
- [ ] Firebase Admin SDK credentials are correct
- [ ] Admin custom claims are set for authorized users
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] CORS is configured if needed
- [ ] Rate limiting is enabled on sensitive routes (optional)

## 🧪 Testing Deployment

1. Visit `https://admin.sutr.store` (or your Vercel URL)
2. You should see the login page
3. Log in with admin credentials
4. Verify:
   - Dashboard loads with stats
   - Can view products
   - Can view orders
   - Can view customers
   - Sidebar navigation works

## 🔄 Continuous Deployment

Vercel automatically redeploys on every push to `main`:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Vercel will:

1. Build the project
2. Run any build-time checks
3. Deploy to production
4. Generate deployment URL

## 📊 Monitoring

### Vercel Analytics

Enable in Vercel Dashboard:

- Real-time analytics
- Performance metrics
- Error tracking

### Application Monitoring

Consider adding:

- Sentry for error tracking
- LogRocket for session replay
- Datadog for performance monitoring

## 🐛 Troubleshooting

### Build Fails

**Error**: `Cannot find module '@/lib/...'`

- **Fix**: Check `tsconfig.json` has correct `paths` configuration

**Error**: Firebase Admin SDK initialization fails

- **Fix**: Verify `FIREBASE_ADMIN_PRIVATE_KEY` format (must include `\n` and quotes)

**Error**: MongoDB connection timeout

- **Fix**: Check MongoDB Atlas IP whitelist and network settings

### Runtime Errors

**Error**: 401 Unauthorized on API routes

- **Fix**: Ensure user has admin custom claim in Firebase

**Error**: Images not loading

- **Fix**: Check `next.config.ts` has Cloudinary in `remotePatterns`

**Error**: Can't connect to MongoDB

- **Fix**: Verify `MONGODB_URI` is correct and cluster is running

## 🔧 Post-Deployment Tasks

1. **Test all features**:
   - Login/logout
   - Product CRUD operations
   - Order management
   - Customer viewing

2. **Set up backups**:
   - MongoDB Atlas automated backups
   - Cloudinary image backups

3. **Configure monitoring**:
   - Set up uptime monitoring
   - Configure error alerts
   - Enable performance tracking

4. **Documentation**:
   - Share admin login credentials securely
   - Document any custom configurations
   - Create user guide for admins

## 📱 Mobile Access

The admin dashboard is responsive but optimized for desktop. For best experience:

- Use on tablet (landscape) or larger
- Desktop/laptop recommended for data entry
- Mobile works for viewing orders/products

## 🔐 Managing Admin Users

### Add New Admin

```javascript
await adminAuth.setCustomUserClaims(userId, { admin: true });
```

### Remove Admin Access

```javascript
await adminAuth.setCustomUserClaims(userId, { admin: false });
```

### List All Admins

```javascript
const listAdmins = async () => {
  const users = await adminAuth.listUsers();
  const admins = users.users.filter(user => user.customClaims?.admin === true);
  return admins.map(u => ({ uid: u.uid, email: u.email }));
};
```

## 🆘 Support

For deployment issues:

1. Check Vercel deployment logs
2. Review browser console for errors
3. Check MongoDB Atlas logs
4. Verify Firebase authentication logs

---

**Deployed**: [Your deployment date]  
**Environment**: Production  
**Version**: 1.0.0
