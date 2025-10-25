# Sutr Admin Dashboard

Admin dashboard for Sutr Clothing - A modern, feature-rich admin panel built with Next.js 15, TypeScript, and Tailwind CSS.

## 🎯 Features

- **Dashboard**: Real-time stats, recent orders, and key metrics
- **Product Management**: Add, edit, delete products with image uploads
- **Order Management**: Track and update order statuses
- **Customer Management**: View and manage customer data
- **Analytics**: Sales reports and performance metrics (coming soon)
- **Authentication**: Firebase Auth with admin role verification
- **Database**: MongoDB for data storage
- **File Storage**: Cloudinary for product images

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or later
- MongoDB Atlas account
- Firebase project with Admin SDK
- Cloudinary account

### Installation

1. Clone the repository:

```bash
cd /home/petrioteer/Documents/1.Projects/sutr-admin
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual credentials.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Setting Up Admin Users

Admin users need a custom claim in Firebase. Use this script to set admin privileges:

```javascript
// In Firebase Admin SDK
import { adminAuth } from './lib/firebase-admin';

await adminAuth.setCustomUserClaims('USER_UID', { admin: true });
```

## 📦 Tech Stack

- **Framework**: Next.js 15.4.4+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Auth + Firebase Admin SDK
- **File Storage**: Cloudinary
- **UI Components**: Headless UI, Heroicons
- **Charts**: Recharts

## 📁 Project Structure

```
sutr-admin/
├── app/                      # Next.js App Router
│   ├── (auth)/
│   │   ├── login/           # Login page
│   │   └── unauthorized/    # Unauthorized access page
│   ├── api/                 # API routes
│   ├── products/            # Product management pages
│   ├── orders/              # Order management pages
│   ├── customers/           # Customer management pages
│   ├── analytics/           # Analytics page
│   ├── settings/            # Settings page
│   ├── layout.tsx           # Root layout with sidebar
│   └── page.tsx             # Dashboard page
├── components/              # Reusable React components
│   ├── Sidebar.tsx
│   └── Header.tsx
├── lib/                     # Utility functions and configs
│   ├── mongodb.ts           # MongoDB connection
│   ├── models/              # Mongoose models
│   ├── firebase.ts          # Firebase client config
│   ├── firebase-admin.ts    # Firebase Admin SDK
│   ├── auth-context.tsx     # Auth context provider
│   ├── auth-admin.ts        # Admin auth helpers
│   └── utils.ts             # Utility functions
├── types/                   # TypeScript type definitions
│   └── index.d.ts
└── public/                  # Static assets
```

## 🔧 Environment Variables

Required environment variables (see `.env.example`):

### Firebase

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### MongoDB

- `MONGODB_URI`

### Cloudinary

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 🎨 Design System

The admin panel follows Sutr Clothing's design language:

- **Primary Color**: Black (`#000000`)
- **Background**: White (`#ffffff`)
- **Accent**: Gray tones for UI elements
- **Typography**: Geist Sans font family
- **Components**: Clean, minimal design with focus on usability

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Domain Setup

- Main site: `sutr.store`
- Admin panel: `admin.sutr.store`

## 📝 API Routes

### Products

- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders

- `GET /api/orders` - List all orders
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order
- `PUT /api/orders/[id]/status` - Update order status

### Upload

- `POST /api/upload` - Upload image to Cloudinary

## 🔒 Security

- Admin authentication required for all routes (except `/login`)
- Firebase custom claims for role verification
- Server-side auth validation on all API routes
- Environment variables never exposed to client
- MongoDB queries use parameterized inputs

## 📚 Documentation

For detailed setup instructions, see:

- [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md) - Complete setup guide
- [ADMIN_PROJECT_SUMMARY.md](./ADMIN_PROJECT_SUMMARY.md) - Project overview

## 🤝 Contributing

This is a private admin dashboard. Contact the project owner for access.

## 📄 License

Proprietary - Sutr Clothing

## 🔗 Related Projects

- **Main Site**: `/Documents/1.Projects/sutr.store`
- **Shared Database**: MongoDB Atlas (sutr-store)
- **Shared Auth**: Firebase project

---

**Version**: 1.0.0  
**Last Updated**: October 22, 2025
