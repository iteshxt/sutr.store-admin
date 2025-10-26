# Sutr Admin Dashboard

Modern admin panel for Sutr Clothing built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

- 📊 **Real-time Dashboard** - Sales stats, recent orders, and analytics
- 🛍️ **Product Management** - Full CRUD operations with image uploads
- 📦 **Order Tracking** - Manage order statuses and customer orders
- 👥 **Customer Management** - View and manage user data
- 📈 **Reports & Analytics** - Comprehensive business insights
- 🔐 **Secure Authentication** - Firebase Auth with role-based access
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 🔑 Environment Variables

```env
# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# MongoDB
MONGODB_URI=your-mongodb-uri

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Auth**: Firebase Admin SDK
- **Storage**: Cloudinary
- **Icons**: Heroicons
