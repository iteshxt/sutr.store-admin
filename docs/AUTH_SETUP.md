# 🔥 Sutr Admin Authentication Setup Guide

This guide will help you set up Firebase authentication for the Sutr Admin Dashboard.

## Prerequisites

- Node.js 18+ installed
- A Firebase project (can be the same as your main Sutr website)
- MongoDB database (local or Atlas)

## Step 1: Firebase Project Setup

### Option A: Use Existing Sutr Project

If you already have a Firebase project for your main Sutr website:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing Sutr project
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication if not already enabled

### Option B: Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project**
3. Name it `sutr-admin` or similar
4. Enable Google Analytics (optional)
5. Go to **Authentication** → **Sign-in method**
6. Enable **Email/Password** authentication

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web app** icon or **Add app** → **Web**
4. Register your app with name `Sutr Admin`
5. Copy the `firebaseConfig` object

## Step 3: Get Firebase Admin SDK Key

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file (keep it secure!)
4. You'll need these values from the JSON:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 4: Environment Configuration

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration in `.env.local`:

   ```bash
   # Firebase Client Configuration (from step 2)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

   # Firebase Admin SDK (from step 3)
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

   # MongoDB (adjust as needed)
   MONGODB_URI=mongodb://localhost:27017/sutr-admin
   
   # Cloudinary (optional, for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Create Admin User

Run the admin creation script:

```bash
node scripts/create-admin.js admin@sutr.store your-secure-password
```

This will:

- Create a Firebase user with the provided email/password
- Grant admin privileges to the user
- Allow them to access the admin dashboard

## Step 7: Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/login` and sign in with your admin credentials.

## How It Works

### Authentication Flow

1. **Login**: User enters email/password on `/login` page
2. **Firebase Auth**: Credentials verified with Firebase
3. **Admin Check**: Custom claims checked to verify admin role
4. **Access Grant**: If admin, user gets access to dashboard
5. **Route Protection**: All routes except `/login` are protected by AuthGuard

### Security Features

- ✅ Firebase Authentication for secure login
- ✅ Custom claims for admin role verification
- ✅ Protected routes with AuthGuard component
- ✅ Automatic redirect for unauthorized users
- ✅ Token validation on both client and server

### Components

- `AuthProvider`: Manages authentication state globally
- `AuthGuard`: Protects routes from unauthorized access
- `ClientLayout`: Conditionally renders sidebar based on auth status
- `LoginPage`: Handles user authentication

## Troubleshooting

### Issue: "Access denied" error

- Check that the user has admin claims set
- Run the create-admin script again to ensure admin privileges

### Issue: Environment variables not working

- Make sure `.env.local` exists (not `.env`)
- Restart the development server after changing env vars
- Check that all required variables are set

### Issue: Firebase connection errors

- Verify Firebase configuration in console
- Check that Authentication is enabled
- Ensure API keys are correct

### Issue: "Module not found" errors

- Run `npm install` to ensure all dependencies are installed
- Check that Firebase packages are properly installed

## Production Deployment

For production:

1. Set environment variables in your hosting platform
2. Use Firebase Auth domain for your production URL
3. Enable only necessary sign-in methods
4. Set up proper security rules
5. Monitor authentication logs

## Next Steps

After authentication is working:

- Implement real product management (replace mock data)
- Add MongoDB connection for data persistence
- Set up image upload with Cloudinary
- Add order management features
- Implement customer management

---

🎉 **You're all set!** Your admin authentication system is now ready to use.
