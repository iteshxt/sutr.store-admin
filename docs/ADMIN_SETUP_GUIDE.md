# Sutr Admin Dashboard - Complete Setup Guide

## 📋 Project Overview

This is the **admin dashboard** for Sutr Clothing, completely separated from the customer-facing website.

### Project Structure

```
/Documents/1.Projects/
├── sutr.store/          ← Customer website (sutr.store)
└── sutr-admin/          ← Admin dashboard (admin.sutr.store)
```

---

## 🎯 Tech Stack

- **Framework**: Next.js 15.4.4+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (shared with main site)
- **Authentication**: Firebase Auth (with admin role checking)
- **File Storage**: Cloudinary (shared with main site)
- **Deployment**: Vercel (separate project)

---

## 🔐 Authentication & Authorization

### Firebase Auth Setup

The admin site uses the **same Firebase project** as the main site, but with role-based access control.

#### Admin User Setup

1. Users must have `admin: true` custom claim in Firebase
2. Set admin claim using Firebase Admin SDK:

```typescript
// Use this code to set admin role for a user
import { auth } from 'firebase-admin';

await auth().setCustomUserClaims(userId, { admin: true });
```

#### Auth Flow

1. Admin logs in via `/login` page
2. Check if user has `admin` custom claim
3. If not admin, redirect to unauthorized page
4. If admin, allow access to dashboard

#### Required Environment Variables

```env
# Firebase Configuration (from main site)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

---

## 💾 Database Connection

### MongoDB Setup

The admin dashboard connects to the **same MongoDB database** as the main site.

#### Database Structure

```
sutr-store (database)
├── products          ← Product catalog
├── orders           ← Customer orders
├── users            ← User accounts
└── wishlist         ← User wishlists
```

#### Required Environment Variables

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/sutr-store?retryWrites=true&w=majority
```

#### Collections Schema

**Products Collection:**

```typescript
{
  _id: ObjectId
  name: string
  slug: string
  description: string
  price: number
  salePrice?: number
  category: string
  images: string[]        // Cloudinary URLs
  sizes: string[]
  colors: string[]
  inStock: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Orders Collection:**

```typescript
{
  _id: ObjectId
  orderNumber: string
  userId: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    size?: string
    color?: string
  }>
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  total: number
  paymentId: string
  paymentStatus: string
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
}
```

**Users Collection:**

```typescript
{
  _id: ObjectId
  firebaseUid: string
  email: string
  name: string
  phone?: string
  avatar?: string
  addresses: Array<Address>
  createdAt: Date
  updatedAt: Date
}
```

---

## 📦 Shared Code to Copy from Main Site

### 1. MongoDB Connection (`/lib/mongodb.ts`)

Copy this file from `sutr.store/lib/mongodb.ts` - handles database connection with connection pooling.

### 2. Models (Copy entire `/lib/models/` folder)

- `Product.ts` - Product model and schema
- `Order.ts` - Order model and schema
- `User.ts` - User model and schema

### 3. Firebase Configuration

- Copy `/lib/firebase.ts` - Client-side Firebase config
- Copy `/lib/firebase-admin.ts` - Server-side Firebase Admin SDK

### 4. TypeScript Types (`/types/index.d.ts`)

Copy all type definitions:

```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  shippingAddress: Address;
  total: number;
  paymentId: string;
  paymentStatus: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. Utility Functions (`/lib/utils.ts`)

Copy helper functions like `formatPrice`, `generateSlug`, etc.

---

## 🎨 Admin Dashboard Features to Build

### Phase 1: Foundation (Priority 1)

#### 1. Layout & Navigation

```
/app/layout.tsx           ← Root layout with admin sidebar
/components/Sidebar.tsx   ← Admin navigation sidebar
/components/Header.tsx    ← Admin header with user menu
```

**Sidebar Navigation:**

- Dashboard (/)
- Products (/products)
- Orders (/orders)
- Customers (/customers)
- Analytics (/analytics)
- Settings (/settings)

#### 2. Authentication System

```
/app/login/page.tsx              ← Admin login page
/app/middleware.ts               ← Route protection
/lib/auth-admin.ts               ← Admin auth helpers
```

**Auth Middleware:**

```typescript
// Check admin role on every request
export async function middleware(request: NextRequest) {
  const user = await getAuthUser();
  const tokenResult = await user?.getIdTokenResult();
  
  if (!tokenResult?.claims?.admin) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!login|unauthorized|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Phase 2: Core Features (Priority 2)

#### 3. Dashboard Page (`/app/page.tsx`)

**Display:**

- Total sales (today, this week, this month)
- Recent orders (last 10)
- Low stock products
- Order status breakdown (pending, processing, shipped, delivered)
- Quick stats cards

#### 4. Products Management (`/app/products/`)

**Pages:**

```
/products/page.tsx              ← Product list with search/filter
/products/new/page.tsx          ← Add new product
/products/[id]/edit/page.tsx    ← Edit product
```

**Features:**

- ✅ View all products (table with pagination)
- ✅ Search products by name/slug
- ✅ Filter by category, stock status, featured
- ✅ Add new product with image upload
- ✅ Edit product details
- ✅ Delete product
- ✅ Bulk actions (delete, mark as featured)
- ✅ Image upload to Cloudinary

**API Routes:**

```
/app/api/products/route.ts              ← GET all, POST new
/app/api/products/[id]/route.ts         ← GET, PUT, DELETE
/app/api/products/upload-image/route.ts ← Upload to Cloudinary
```

#### 5. Orders Management (`/app/orders/`)

**Pages:**

```
/orders/page.tsx              ← Orders list
/orders/[id]/page.tsx         ← Order details
```

**Features:**

- ✅ View all orders (table with filters)
- ✅ Filter by status, date range
- ✅ Search by order number, customer email
- ✅ Update order status
- ✅ Add tracking number
- ✅ View customer details
- ✅ Print invoice
- ✅ Send status update emails

**API Routes:**

```
/app/api/orders/route.ts                  ← GET all orders
/app/api/orders/[id]/route.ts             ← GET, PUT order
/app/api/orders/[id]/update-status/route.ts ← Update status
```

#### 6. Customers Management (`/app/customers/`)

**Pages:**

```
/customers/page.tsx           ← Customers list
/customers/[id]/page.tsx      ← Customer details
```

**Features:**

- ✅ View all customers
- ✅ Search by name, email
- ✅ View customer order history
- ✅ View customer addresses
- ✅ Customer lifetime value

### Phase 3: Advanced Features (Priority 3)

#### 7. Analytics (`/app/analytics/page.tsx`)

- Sales charts (daily, weekly, monthly)
- Best selling products
- Customer acquisition trends
- Revenue breakdown by category

**Libraries to Use:**

- Recharts or Chart.js for graphs
- Date range picker for filtering

#### 8. Settings (`/app/settings/page.tsx`)

- Site settings
- Email templates
- Shipping settings
- Payment gateway settings

---

## 🎨 UI Component Libraries (Recommended)

### Option 1: shadcn/ui (Recommended)

Clean, customizable components built on Radix UI + Tailwind.

```bash
npx shadcn@latest init
```

**Components to Install:**

- Table (for product/order lists)
- Form (for add/edit products)
- Dialog (for confirmations)
- Select (for dropdowns)
- Button, Input, Label
- Card (for dashboard stats)
- Badge (for status indicators)

### Option 2: Headless UI

Unstyled components from Tailwind team.

```bash
npm install @headlessui/react
```

### Option 3: DaisyUI

Tailwind component library.

```bash
npm install daisyui
```

---

## 📡 API Routes Structure

All admin APIs should:

1. Verify admin authentication
2. Validate request data
3. Return proper error codes

### Example API Route Pattern

```typescript
// /app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Connect to DB
    await connectDB();

    // 3. Fetch data
    const products = await Product.find().sort({ createdAt: -1 });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate data
    if (!data.name || !data.price) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectDB();
    
    const product = await Product.create(data);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## 🖼️ Cloudinary Integration

### Image Upload Flow

1. Admin selects images in product form
2. Upload to Cloudinary via API route
3. Get Cloudinary URLs
4. Save URLs in MongoDB

### Cloudinary Configuration

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Upload API Route

```typescript
// /app/api/upload/route.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'sutr-store/products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  return NextResponse.json({ url: result.secure_url });
}
```

---

## 🚀 Deployment

### Vercel Setup

1. **Create New Vercel Project**
   - Connect GitHub repo: `sutr-admin`
   - Set domain: `admin.sutr.store`

2. **Environment Variables**
   Copy from main site + add admin-specific:

   ```
   MONGODB_URI=
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   FIREBASE_ADMIN_PROJECT_ID=
   FIREBASE_ADMIN_PRIVATE_KEY=
   FIREBASE_ADMIN_CLIENT_EMAIL=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

3. **Deploy Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node Version: 20.x

### Domain Configuration

1. In Vercel dashboard, go to Domains
2. Add `admin.sutr.store`
3. Update DNS (if not automatic):
   - Type: CNAME
   - Name: admin
   - Value: cname.vercel-dns.com

---

## 📦 Required npm Packages

### Core Dependencies

```bash
npm install mongoose firebase firebase-admin cloudinary
npm install @heroicons/react recharts date-fns
```

### UI Components (Optional)

```bash
npm install @headlessui/react @radix-ui/react-dialog
npm install react-hook-form zod
npm install @tanstack/react-table
```

### Dev Dependencies

```bash
npm install -D @types/node
```

---

## 🔒 Security Checklist

- [ ] Admin authentication with Firebase custom claims
- [ ] Protected API routes (verify admin on every request)
- [ ] Protected pages (middleware checks admin role)
- [ ] Environment variables secured in Vercel
- [ ] CORS configured for admin domain only
- [ ] Rate limiting on API routes
- [ ] Input validation on all forms
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens for mutations

---

## 📝 Development Workflow

### 1. Local Development

```bash
cd /home/petrioteer/Documents/1.Projects/sutr-admin
npm run dev
# Opens on http://localhost:3000
```

### 2. Testing Against Production DB

Use MongoDB URI from main site to test with real data.

### 3. Git Workflow

```bash
git add .
git commit -m "feat: add product management"
git push origin main
```

Vercel auto-deploys on push to main.

---

## 🆘 Troubleshooting

### Common Issues

**1. "Unauthorized" on all routes**

- Check Firebase custom claims are set for your user
- Verify `FIREBASE_ADMIN_*` env vars are correct
- Check middleware is not blocking login page

**2. Database connection fails**

- Verify `MONGODB_URI` has correct password
- Check MongoDB Atlas IP whitelist includes Vercel IPs (use 0.0.0.0/0 for all)
- Ensure database name matches in connection string

**3. Images not uploading**

- Verify Cloudinary credentials
- Check file size limits
- Ensure `NEXT_PUBLIC_` prefix for client-side vars

**4. Admin claim not working**

- Custom claims must be set via Firebase Admin SDK (not in Firebase Console)
- User must log out and log back in after setting custom claims
- Check token expiry (refresh token)

---

## 🔗 Important Links

- **Customer Site**: <https://sutr.store>
- **Admin Site**: <https://admin.sutr.store>
- **MongoDB Atlas**: [Your cluster URL]
- **Firebase Console**: <https://console.firebase.google.com>
- **Cloudinary Dashboard**: <https://cloudinary.com/console>
- **Vercel Dashboard**: <https://vercel.com>

---

## 📞 Support & Resources

- Next.js Docs: <https://nextjs.org/docs>
- MongoDB Docs: <https://docs.mongodb.com>
- Firebase Auth: <https://firebase.google.com/docs/auth>
- Cloudinary Docs: <https://cloudinary.com/documentation>
- Tailwind CSS: <https://tailwindcss.com/docs>

---

## ✅ Implementation Checklist

### Phase 1: Setup (Week 1)

- [ ] Copy shared code from main site
- [ ] Set up Firebase auth with admin claims
- [ ] Create admin login page
- [ ] Set up route protection middleware
- [ ] Create dashboard layout with sidebar
- [ ] Deploy to Vercel as `admin.sutr.store`

### Phase 2: Products (Week 2)

- [ ] Products list page with search/filter
- [ ] Add new product form
- [ ] Edit product form
- [ ] Delete product functionality
- [ ] Image upload to Cloudinary
- [ ] Bulk actions

### Phase 3: Orders (Week 3)

- [ ] Orders list with filters
- [ ] Order details page
- [ ] Update order status
- [ ] Add tracking number
- [ ] Send email notifications

### Phase 4: Customers (Week 4)

- [ ] Customers list
- [ ] Customer details with order history
- [ ] Search and filter customers

### Phase 5: Analytics (Week 5)

- [ ] Dashboard with stats cards
- [ ] Sales charts
- [ ] Best selling products
- [ ] Revenue analytics

---

## 🎯 Quick Start for AI Agent

**Context for New AI Session:**

You're building the admin dashboard for Sutr Clothing located at `/Documents/1.Projects/sutr-admin`. This is a completely separate Next.js project from the customer site.

**Key Files Needed from Main Site** (`/Documents/1.Projects/sutr.store`):

1. Copy `/lib/mongodb.ts` → MongoDB connection
2. Copy `/lib/models/` folder → Database models (Product, Order, User)
3. Copy `/lib/firebase.ts` and `/lib/firebase-admin.ts` → Auth
4. Copy `/types/index.d.ts` → TypeScript types
5. Copy `.env.local` values → Environment variables

**First Tasks:**

1. Set up admin authentication (Firebase + custom claims)
2. Create protected route middleware
3. Build dashboard layout with sidebar
4. Create products CRUD pages

**Database Connection:**

- Use same MongoDB database as main site
- Database name: `sutr-store`
- Collections: products, orders, users, wishlist

**Authentication:**

- Firebase Auth with `admin: true` custom claim
- Check claim on every protected route
- Redirect non-admins to `/unauthorized`

**Start Here:**

```bash
cd /home/petrioteer/Documents/1.Projects/sutr-admin
npm run dev
```

Good luck! 🚀
