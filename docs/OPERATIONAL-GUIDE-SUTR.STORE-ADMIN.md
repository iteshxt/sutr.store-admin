# Sutr Clothing Admin Panel - Operational Guide

> **Version:** 1.5.0  
> **Last Updated:** February 11, 2026  
> **Author:** [Itesh Tomar](https://github.com/iteshxt)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Admin User Management](#2-admin-user-management)
3. [Dashboard Operations](#3-dashboard-operations)
4. [Product Management](#4-product-management)
5. [Order Management](#5-order-management)
6. [Customer Management](#6-customer-management)
7. [Banner Management](#7-banner-management)
8. [Reports & Analytics](#8-reports--analytics)
9. [Site Settings](#9-site-settings)
10. [Adding New Features](#10-adding-new-features)
11. [Database Operations](#11-database-operations)
12. [Deployment Guide](#12-deployment-guide)
13. [Troubleshooting](#13-troubleshooting)
14. [Maintenance Tasks](#14-maintenance-tasks)

---

## 1. Getting Started

### 1.1 Development Environment Setup

#### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- MongoDB Atlas account
- Firebase project with Authentication enabled
- Cloudinary account
- Git

#### Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/sutr.store-admin.git
cd sutr.store-admin

# Install dependencies
npm install
```

#### Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env.local
```

Required environment variables:

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sutr?retryWrites=true&w=majority

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

#### Start Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### 1.2 Project Structure

```
sutr.store-admin/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── banners/       # Banner management
│   │   ├── categories/    # Category management
│   │   ├── dashboard/     # Dashboard statistics
│   │   ├── orders/        # Order management
│   │   ├── products/      # Product CRUD
│   │   ├── profile/       # Admin profile
│   │   ├── reports/       # Business reports
│   │   ├── site-settings/ # Maintenance mode
│   │   ├── statistics/    # Analytics data
│   │   ├── upload/        # Image uploads
│   │   └── users/         # Customer management
│   ├── customers/         # Customer list page
│   ├── login/             # Admin login
│   ├── orders/            # Order management page
│   ├── products/          # Product management pages
│   ├── profile/           # Admin profile page
│   ├── reports/           # Reports page
│   ├── statistics/        # Analytics page
│   └── page.tsx           # Dashboard
├── components/            # React components
├── lib/                   # Utilities & models
│   ├── models/           # Mongoose schemas
│   ├── auth-admin.ts     # Admin authentication
│   ├── auth-context.tsx  # Auth state management
│   ├── firebase.ts       # Firebase client
│   ├── firebase-admin.ts # Firebase Admin SDK
│   └── mongodb.ts        # Database connection
├── scripts/              # Admin utilities
│   └── create-admin.js   # Admin user creation
└── types/                # TypeScript definitions
```

### 1.3 Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint

# Admin Scripts
node scripts/create-admin.js <email> <password>  # Create admin user

# Database (via MongoDB Shell)
mongosh "mongodb+srv://..."  # Connect to database
```

---

## 2. Admin User Management

### 2.1 Creating a New Admin User

Use the provided script to create admin users with Firebase custom claims:

```bash
node scripts/create-admin.js admin@sutr.store SecurePassword123
```

This script:

1. Creates a Firebase Auth user with the provided credentials
2. Sets the `admin: true` custom claim
3. Outputs the user UID for verification

#### Manual Admin Creation

If the script fails, create admin manually:

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize admin (if not already done)
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

// Create user and set admin claim
async function createAdminUser(email, password) {
  const user = await admin.auth().createUser({ email, password });
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log('Admin created:', user.uid);
}

createAdminUser('admin@sutr.store', 'SecurePassword123');
```

### 2.2 Granting Admin Access to Existing User

If a user already exists in Firebase:

```javascript
// Grant admin privileges
async function grantAdminAccess(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log('Admin access granted to:', email);
}

grantAdminAccess('existing-user@example.com');
```

### 2.3 Revoking Admin Access

```javascript
// Remove admin privileges
async function revokeAdminAccess(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: false });
  console.log('Admin access revoked from:', email);
}
```

### 2.4 Session Management

The admin panel includes automatic session timeout:

- **Session Duration:** 1 hour of inactivity
- **Warning:** 5-minute warning modal before logout
- **Activity Reset:** Any user interaction resets the timer

Session timeout is managed in `lib/use-session-timeout.ts`:

```typescript
const SESSION_TIMEOUT = 60 * 60 * 1000;      // 1 hour
const WARNING_TIME = 5 * 60 * 1000;          // 5 minutes before
```

---

## 3. Dashboard Operations

### 3.1 Understanding Dashboard Metrics

The dashboard displays real-time metrics from `/api/dashboard/stats`:

| Metric | Description | Source |
|--------|-------------|--------|
| Total Revenue | Sum of all delivered order totals | `orders.status === 'delivered'` |
| Total Orders | Count of all orders | `orders.count()` |
| Total Customers | Count of registered users | `users.count()` |
| Total Products | Count of active products | `products.count()` |
| Low Stock Products | Products with stock ≤ 10 | `product.stock <= 10` |
| Out of Stock | Products with stock = 0 | `product.stock === 0` |

### 3.2 Dashboard Quick Actions

From the dashboard, you can:

1. **View Recent Orders** - Last 10 orders with status
2. **Check Low Stock Alerts** - Products needing restock
3. **See Revenue Trends** - Last 30 days performance
4. **Access Quick Links** - Navigate to management pages

### 3.3 API: Fetch Dashboard Stats

```typescript
// Client-side fetch
const response = await fetch('/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
  },
});

const { stats } = await response.json();
// stats contains: totalRevenue, totalOrders, totalCustomers, totalProducts
```

---

## 4. Product Management

### 4.1 Product Data Structure

```typescript
interface Product {
  _id: string;
  name: string;                    // "Oversized Vintage Tee"
  slug: string;                    // "oversized-vintage-tee"
  description: string;             // Full product description
  price: number;                   // 1999 (paise)
  salePrice?: number;              // 1499 (optional discount)
  images: string[];                // Cloudinary URLs
  category: string;                // "mens"
  subcategory?: string;            // "tees"
  tags: string[];                  // ["oversized", "vintage"]
  sizes: string[];                 // ["S", "M", "L", "XL"]
  colors: string[];                // ["Black", "White"]
  inStock: boolean | boolean[];    // Stock availability
  stock: number | number[];        // Quantity per size
  featured: boolean;               // Show in featured section
  newArrival: boolean;             // Show in new arrivals
  weight: number;                  // Grams for shipping
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Adding a New Product

#### Via Admin UI

1. Navigate to **Products** → **Add New Product**
2. Fill in product details:
   - Name, description, price
   - Category and subcategory
   - Sizes and colors available
   - Stock quantities
3. Upload product images (drag & drop or click to browse)
4. Set featured/new arrival flags
5. Click **Create Product**

#### Via API

```typescript
// POST /api/products
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'New Product Name',
    slug: 'new-product-name',
    description: 'Product description...',
    price: 1999,
    images: ['https://cloudinary.com/...'],
    category: 'mens',
    subcategory: 'tees',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    inStock: true,
    stock: 50,
    weight: 300,
  }),
});
```

### 4.3 Editing a Product

#### Via Admin UI

1. Navigate to **Products**
2. Click the **Edit** icon on the product row
3. Modify fields as needed
4. Click **Update Product**

#### Via API

```typescript
// PUT /api/products/[id]
const response = await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    price: 1799,
    salePrice: 1499,
    stock: 45,
  }),
});
```

### 4.4 Deleting a Product

#### Via Admin UI

1. Navigate to **Products**
2. Click the **Delete** icon on the product row
3. Confirm deletion in the modal

#### Via API

```typescript
// DELETE /api/products/[id]
const response = await fetch(`/api/products/${productId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### 4.5 Managing Product Images

Images are uploaded to Cloudinary via the `/api/upload` endpoint:

```typescript
// Upload a product image
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const { url, publicId } = await response.json();
// Use url in product.images array
```

### 4.6 Stock Management

#### Single Stock (All Sizes Same)

```typescript
{
  sizes: ['S', 'M', 'L', 'XL'],
  inStock: true,
  stock: 100  // 100 total across all sizes
}
```

#### Per-Size Stock

```typescript
{
  sizes: ['S', 'M', 'L', 'XL'],
  inStock: [true, true, false, true],  // L is out of stock
  stock: [25, 30, 0, 20]               // Quantities per size
}
```

#### Updating Stock

```javascript
// Via MongoDB
db.products.updateOne(
  { slug: 'product-slug' },
  { $set: { 'stock.2': 0, 'inStock.2': false } }  // Set L size out of stock
);
```

---

## 5. Order Management

### 5.1 Order Data Structure

```typescript
interface Order {
  id: string;                      // "SUTR_A7K9M2"
  userId: string;                  // Firebase UID
  items: OrderItem[];              // Products ordered
  total: number;                   // Total in paise
  subtotal: number;                // Before shipping
  shippingCost: number;            // Shipping charges
  discount?: number;               // Coupon discount
  couponCode?: string;             // Applied coupon
  
  status: OrderStatus;             // Current order status
  paymentStatus: PaymentStatus;    // Payment state
  paymentMethod: string;           // "online" | "cod"
  razorpayOrderId?: string;        // Razorpay reference
  razorpayPaymentId?: string;      // Payment reference
  
  shippingAddress: Address;        // Delivery address
  shipping?: ShippingInfo;         // Tracking details
  
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'out for delivery'
  | 'delivered'
  | 'cancelled';
```

### 5.2 Viewing Orders

#### Via Admin UI

1. Navigate to **Orders**
2. View order list with status badges
3. Use filters to find specific orders
4. Click an order row to view details

#### Via API

```typescript
// GET /api/orders
const response = await fetch('/api/orders', {
  headers: { 'Authorization': `Bearer ${token}` },
});

// With filters
const filtered = await fetch('/api/orders?status=processing&page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### 5.3 Updating Order Status

#### Via Admin UI

1. Open order details modal
2. Select new status from dropdown
3. Click **Update Status**

#### Via API

```typescript
// PATCH /api/orders/[id]
const response = await fetch(`/api/orders/${orderId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'shipped',
    trackingNumber: 'EKART123456',
    trackingUrl: 'https://tracking.example.com/EKART123456',
  }),
});
```

### 5.4 Order Status Workflow

```
Standard Flow:
  pending → processing → shipped → out for delivery → delivered

Alternative Flows:
  pending → cancelled (customer request)
  processing → cancelled (stock issue)
  shipped → returned (RTO)
```

### 5.5 Handling Cancellations

```typescript
// Cancel an order
await fetch(`/api/orders/${orderId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'cancelled',
    cancellationReason: 'Customer request',
  }),
});

// Remember to:
// 1. Restore product stock
// 2. Process refund if paid
// 3. Notify customer
```

### 5.6 Order Details Modal

The `OrderDetailsModal` component shows:

- Customer information
- Shipping address
- Order items with images
- Payment details
- Status history
- Tracking information

---

## 6. Customer Management

### 6.1 Viewing Customers

Navigate to **Customers** to see:

- All registered users
- Email and registration date
- Order count per customer
- Total spend

#### Via API

```typescript
// GET /api/users
const response = await fetch('/api/users', {
  headers: { 'Authorization': `Bearer ${token}` },
});

// With pagination
const paginated = await fetch('/api/users?page=1&limit=50', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### 6.2 Customer Details

View individual customer by ID:

```typescript
// GET /api/users/[id]
const response = await fetch(`/api/users/${userId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Response includes:
// - profile info
// - addresses
// - order history
```

### 6.3 Customer Order History

```typescript
// GET /api/users/[id]/orders
const response = await fetch(`/api/users/${userId}/orders`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### 6.4 MongoDB Customer Queries

```javascript
// Find customer by email
db.users.findOne({ email: 'customer@example.com' });

// Find customers with orders
db.users.find({ 'orderCount': { $gt: 0 } });

// Find high-value customers (> ₹10,000 spent)
db.users.find({ 'totalSpent': { $gte: 1000000 } });

// Recent signups (last 7 days)
db.users.find({
  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});
```

---

## 7. Banner Management

### 7.1 Banner Types

The platform supports two banner types:

| Type | Dimensions | Usage |
|------|------------|-------|
| Desktop | 1920×600px | Main hero carousel on desktop |
| Mobile | 768×600px | Main hero carousel on mobile |

### 7.2 Uploading Banners

#### Via Admin UI

1. Navigate to **Dashboard** (homepage has banner management)
2. Click **Manage Banners** or use the `BannerUploadModal`
3. Select device type (Mobile/Desktop)
4. Drag & drop or click to upload image
5. Banner is automatically added to rotation

#### Via API

```typescript
// POST /api/banners
const response = await fetch('/api/banners', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://res.cloudinary.com/.../banner1.jpg',
    cloudinaryPublicId: 'banners/banner1',
    deviceType: 'desktop',  // or 'mobile'
  }),
});
```

### 7.3 Banner Data Structure

```typescript
interface BannerDocument {
  _id: string;
  mobileBanners: BannerImage[];
  desktopBanners: BannerImage[];
  updatedAt: Date;
}

interface BannerImage {
  url: string;
  cloudinaryPublicId: string;
  order: number;
  link?: string;          // Optional click-through URL
  altText?: string;       // Accessibility text
}
```

### 7.4 Reordering Banners

```typescript
// PATCH /api/banners
const response = await fetch('/api/banners', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    deviceType: 'desktop',
    banners: [
      { cloudinaryPublicId: 'banners/banner2', order: 0 },
      { cloudinaryPublicId: 'banners/banner1', order: 1 },
    ],
  }),
});
```

### 7.5 Deleting Banners

```typescript
// DELETE /api/banners/[id]
const response = await fetch(`/api/banners/${bannerId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    deviceType: 'desktop',
    cloudinaryPublicId: 'banners/banner1',
  }),
});
```

---

## 8. Reports & Analytics

### 8.1 Available Reports

Navigate to **Reports** to access:

| Report | Description |
|--------|-------------|
| Sales Report | Revenue, order count, average order value |
| Inventory Report | Stock levels, low stock alerts, inventory value |
| Customer Report | New vs returning customers, conversion rate |
| Order Status Report | Orders by status breakdown |

### 8.2 Generating Reports

#### Via Admin UI

1. Navigate to **Reports**
2. Select date range (7 days, 30 days, 90 days, all time)
3. View generated reports with visualizations

#### Via API

```typescript
// GET /api/reports?range=30days
const response = await fetch('/api/reports?range=30days', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { report } = await response.json();
// report contains: salesReport, inventoryReport, customerReport, orderReport
```

### 8.3 Report Response Structure

```typescript
interface ReportResponse {
  salesReport: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProduct: string;
    periodStart: string;
    periodEnd: string;
  };
  inventoryReport: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
  };
  customerReport: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    conversionRate: string;
  };
  orderReport: {
    pending: number;
    processing: number;
    shipped: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
}
```

### 8.4 Statistics Page

Navigate to **Statistics** for advanced analytics:

- Revenue by day (line chart)
- Orders by status (pie chart)
- Top selling products (bar chart)
- Customer growth (area chart)
- Revenue by category
- Monthly comparison

The statistics page uses **Recharts** for visualizations.

### 8.5 API: Statistics

```typescript
// GET /api/statistics
const response = await fetch('/api/statistics', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { statistics } = await response.json();
// Contains: revenueByDay, ordersByStatus, topProducts, customerGrowth, etc.
```

---

## 9. Site Settings

### 9.1 Maintenance Mode

Enable maintenance mode to block access to the main store:

#### Via API

```typescript
// GET current settings
const response = await fetch('/api/site-settings');
const { settings } = await response.json();
// { maintenance: false }

// Toggle maintenance mode
const updated = await fetch('/api/site-settings', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ maintenance: true }),
});
```

### 9.2 Adding New Site Settings

To add more site settings, update the model:

**File:** `lib/models/SiteSettings.ts`

```typescript
const SiteSettingsSchema = new Schema({
  maintenance: { type: Boolean, default: false },
  // Add new settings:
  announcementBar: { type: String, default: '' },
  freeShippingThreshold: { type: Number, default: 999 },
  holidayMode: { type: Boolean, default: false },
});
```

---

## 10. Adding New Features

### 10.1 Creating a New Admin Page

#### Step 1: Create Page File

```bash
mkdir -p app/new-page
```

**File:** `app/new-page/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';

export default function NewPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/new-endpoint', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">New Page</h1>
      {/* Page content */}
    </div>
  );
}
```

#### Step 2: Add to Sidebar

**File:** `components/Sidebar.tsx`

```typescript
const navItems = [
  // ... existing items
  {
    name: 'New Page',
    href: '/new-page',
    icon: NewPageIcon,
  },
];
```

### 10.2 Creating a New API Route

#### Step 1: Create Route File

```bash
mkdir -p app/api/new-endpoint
```

**File:** `app/api/new-endpoint/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const isAdmin = await verifyAdminToken(token);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    await connectDB();

    // Your logic here
    const data = { message: 'Success' };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 10.3 Creating a New Database Model

**File:** `lib/models/NewModel.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface INewModel extends Document {
  name: string;
  value: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewModelSchema = new Schema<INewModel>(
  {
    name: { type: String, required: true },
    value: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
NewModelSchema.index({ name: 1 });
NewModelSchema.index({ active: 1 });

const NewModel = mongoose.models.NewModel || 
  mongoose.model<INewModel>('NewModel', NewModelSchema);

export default NewModel;
```

### 10.4 Adding a New Dashboard Widget

Create a widget component:

```typescript
// components/widgets/NewWidget.tsx
'use client';

interface NewWidgetProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

export default function NewWidget({ title, value, icon, trend }: NewWidgetProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}
```

---

## 11. Database Operations

### 11.1 Connecting to MongoDB

```bash
# Via MongoDB Compass
mongodb+srv://username:password@cluster.mongodb.net/sutr

# Via MongoDB Shell
mongosh "mongodb+srv://cluster.mongodb.net/sutr" --username username
```

### 11.2 Common Database Queries

#### Products

```javascript
// Find all products
db.products.find();

// Find by category
db.products.find({ category: 'mens', subcategory: 'tees' });

// Find low stock products
db.products.find({
  $or: [
    { stock: { $lte: 10 } },
    { 'stock': { $elemMatch: { $lte: 10 } } }
  ]
});

// Update product price
db.products.updateOne(
  { slug: 'product-slug' },
  { $set: { price: 1999, salePrice: 1499 } }
);

// Bulk update featured products
db.products.updateMany(
  { category: 'mens' },
  { $set: { featured: false } }
);
```

#### Orders

```javascript
// Find recent orders
db.orders.find().sort({ createdAt: -1 }).limit(10);

// Find orders by status
db.orders.find({ status: 'processing' });

// Find high-value orders
db.orders.find({ total: { $gte: 500000 } }); // ≥ ₹5,000

// Count orders by status
db.orders.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);

// Update shipping info
db.orders.updateOne(
  { id: 'SUTR_A7K9M2' },
  {
    $set: {
      status: 'shipped',
      'shipping.trackingNumber': 'EKART123456'
    }
  }
);
```

#### Users

```javascript
// Find customer by email
db.users.findOne({ email: 'customer@example.com' });

// Find admin users
db.users.find({ role: 'admin' });

// Count users by creation month
db.users.aggregate([
  {
    $group: {
      _id: { $month: '$createdAt' },
      count: { $sum: 1 }
    }
  }
]);
```

### 11.3 Database Backup

```bash
# Export entire database
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y-%m-%d)

# Export specific collection
mongodump --uri="mongodb+srv://..." --collection=products --out=/backup

# Import database
mongorestore --uri="mongodb+srv://..." /backup/2026-02-11

# Import specific collection
mongorestore --uri="mongodb+srv://..." --collection=products /backup/products.bson
```

### 11.4 Index Management

```javascript
// View existing indexes
db.products.getIndexes();
db.orders.getIndexes();
db.users.getIndexes();

// Create recommended indexes
db.products.createIndex({ category: 1, subcategory: 1 });
db.products.createIndex({ slug: 1 }, { unique: true });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.users.createIndex({ firebaseUid: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## 12. Deployment Guide

### 12.1 Pre-Deployment Checklist

```
☐ All environment variables configured
☐ Firebase Admin credentials set
☐ MongoDB connection string updated
☐ Cloudinary credentials verified
☐ Admin user created
☐ Database indexes in place
☐ Build passes without errors
☐ All API endpoints tested
```

### 12.2 Deploying to Vercel

#### Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

#### Via Dashboard

```
1. Go to vercel.com
2. Import Git repository
3. Configure:
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: npm run build
4. Add all environment variables
5. Deploy
```

### 12.3 Environment Variables in Vercel

```
Settings → Environment Variables

Add each variable:
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 12.4 Post-Deployment Verification

```
☐ Admin login works
☐ Dashboard loads with stats
☐ Product list displays
☐ Can create/edit products
☐ Orders page loads
☐ Customer list displays
☐ Banner upload works
☐ Reports generate correctly
☐ Statistics charts render
☐ Session timeout works
```

---

## 13. Troubleshooting

### 13.1 Authentication Issues

#### "Admin access required" Error

```
Cause: User doesn't have admin custom claim

Solution:
1. Verify admin claim exists:
   firebase.auth().currentUser.getIdTokenResult().then(r => console.log(r.claims));
   
2. Set admin claim via script:
   node scripts/create-admin.js existing@email.com password
   
3. Sign out and sign in again to refresh token
```

#### Session Timeout Not Working

```
Cause: Activity listeners not attached

Solution:
1. Verify AuthGuard wraps all protected pages
2. Check console for useSessionTimeout errors
3. Clear localStorage and re-login
```

### 13.2 Database Issues

#### MongooseServerSelectionError

```
Cause: Cannot connect to MongoDB

Solutions:
1. Check MONGODB_URI in .env.local
2. Verify IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for Vercel)
3. Check database user credentials
4. Ensure network allows MongoDB port (27017)
```

#### Duplicate Key Error

```
Cause: Unique constraint violation

Solutions:
1. Check for existing document with same key
2. Use findOneAndUpdate with upsert: true
3. Add error handling for duplicate detection
```

### 13.3 API Issues

#### 401 Unauthorized

```
Cause: Missing or invalid Firebase token

Solutions:
1. Ensure user is logged in
2. Check token is being passed: Authorization: Bearer <token>
3. Token might be expired - refresh with getIdToken(true)
```

#### 403 Admin Required

```
Cause: User lacks admin: true claim

Solutions:
1. Run admin creation script
2. Verify claim set correctly
3. User must sign out and back in
```

### 13.4 Image Upload Issues

#### Cloudinary Upload Failed

```
Cause: Invalid credentials or file issue

Solutions:
1. Verify CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
2. Check file size (max 10MB)
3. Verify cloud name is correct
4. Check Cloudinary usage quota
```

### 13.5 Debugging Steps

```bash
# Check server logs (development)
# Terminal running npm run dev

# Check server logs (Vercel)
# Dashboard → Deployments → Logs

# Check browser console
# DevTools → Console

# Check network requests
# DevTools → Network → Filter by XHR
```

---

## 14. Maintenance Tasks

### 14.1 Daily Tasks

```
☐ Review new orders
☐ Check low stock alerts
☐ Monitor failed operations in logs
☐ Verify dashboard metrics loading
```

### 14.2 Weekly Tasks

```
☐ Review order status distribution
☐ Update featured products
☐ Check banner rotation
☐ Review customer registrations
☐ Generate weekly sales report
```

### 14.3 Monthly Tasks

```
☐ Database backup
☐ Update dependencies
☐ Review analytics trends
☐ Security audit (npm audit)
☐ Clean up test data
☐ Review and rotate API keys
```

### 14.4 Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update next

# Update to latest versions
npm install next@latest react@latest react-dom@latest

# After updates, test thoroughly
npm run build
npm run lint
```

### 14.5 Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Review security report
npm audit --production
```

### 14.6 Database Maintenance

```javascript
// Clean up old sessions/tokens
db.sessions.deleteMany({
  expiresAt: { $lt: new Date() }
});

// Archive old orders (> 1 year)
db.orders_archive.insertMany(
  db.orders.find({
    createdAt: { $lt: new Date('2025-01-01') },
    status: 'delivered'
  }).toArray()
);
```

---

## Appendix A: Quick Command Reference

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Lint code

# Admin Management
node scripts/create-admin.js <email> <password>

# Deployment
vercel                   # Deploy preview
vercel --prod            # Deploy production
vercel logs              # View logs

# Database
mongosh "mongodb+srv://..."  # Connect to DB
mongodump --uri="..."        # Backup
mongorestore --uri="..."     # Restore
```

---

## Appendix B: API Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Dashboard metrics |
| `/api/products` | GET | List all products |
| `/api/products` | POST | Create product |
| `/api/products/[id]` | GET | Get single product |
| `/api/products/[id]` | PUT | Update product |
| `/api/products/[id]` | DELETE | Delete product |
| `/api/orders` | GET | List all orders |
| `/api/orders/[id]` | GET | Get single order |
| `/api/orders/[id]` | PATCH | Update order status |
| `/api/users` | GET | List all customers |
| `/api/users/[id]` | GET | Get customer details |
| `/api/users/[id]/orders` | GET | Customer order history |
| `/api/banners` | GET | Get all banners |
| `/api/banners` | POST | Add banner |
| `/api/banners/[id]` | DELETE | Remove banner |
| `/api/reports` | GET | Generate reports |
| `/api/statistics` | GET | Analytics data |
| `/api/categories` | GET | List categories |
| `/api/upload` | POST | Upload image |
| `/api/profile` | GET | Admin profile |
| `/api/profile` | PATCH | Update profile |
| `/api/site-settings` | GET | Get settings |
| `/api/site-settings` | PATCH | Update settings |

---

## Appendix C: Environment Variables Template

```bash
# .env.example

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sutr?retryWrites=true&w=majority

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Feb 11, 2026 | [Itesh Tomar](https://github.com/iteshxt) | Initial operational guide created |

---

*For technical architecture details, refer to [ARCHITECTURE-SUTR.STORE-ADMIN.md](./ARCHITECTURE-SUTR.STORE-ADMIN.md)*

*For the main e-commerce platform guide, refer to [OPERATIONAL-GUIDE-SUTR.STORE.md](./OPERATIONAL-GUIDE-SUTR.STORE.md)*

*For questions or issues, contact the development team or create an issue in the repository.*
