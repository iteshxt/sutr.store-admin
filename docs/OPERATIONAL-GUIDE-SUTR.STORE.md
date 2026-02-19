# Sutr Clothing - Operational Guide

> **Version:** 1.6.2
> **Last Updated:** February 11, 2026  
> **Author:** [Itesh Tomar](https://github.com/iteshxt)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Content Management](#2-content-management)
3. [Adding New Products](#3-adding-new-products)
4. [Managing Users](#4-managing-users)
5. [Order Management](#5-order-management)
6. [Adding New Features](#6-adding-new-features)
7. [UI Components Guide](#7-ui-components-guide)
8. [Database Operations](#8-database-operations)
9. [Deployment Guide](#9-deployment-guide)
10. [Troubleshooting](#10-troubleshooting)
11. [Maintenance Tasks](#11-maintenance-tasks)

---

## 1. Getting Started

### 1.1 Development Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd sutr.store

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

### 1.2 Project Structure Quick Reference

```
Key Directories:
├── app/              → Pages and API routes
├── components/       → Reusable UI components
├── lib/              → Business logic, contexts, utilities
├── public/           → Static assets
└── docs/             → Documentation
```

### 1.3 Common Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

---

## 2. Content Management

### 2.1 Updating Static Pages

#### Edit About Page

**File:** `app/about/page.tsx`

```typescript
// To change the hero text
const hero = {
  title: "Your New Title Here",
  subtitle: "Your new subtitle",
};

// To modify values section
const values = [
  {
    icon: Community,
    title: "Your Value",
    description: "Your description",
  },
  // Add more values...
];
```

#### Edit Privacy Policy

**File:** `app/privacy-policy/page.tsx`

```typescript
// Update last updated date
const lastUpdated = "MM/DD/YYYY";

// Edit sections
const sections = [
  {
    title: "Section Title",
    content: "Section content...",
  },
];
```

#### Edit Terms of Service

**File:** `app/terms-of-service/page.tsx`

Similar structure to privacy policy. Update sections array.

#### Edit Return & Refund Policy

**File:** `app/return-refund/page.tsx`

```typescript
// Update contact information
const contactInfo = {
  email: "contact@sutr.store",
  phone: "+91 XXXXXXXXXX",
};

// Update return window
const returnWindow = 7; // days
```

### 2.2 Managing Homepage Content

#### Update Hero Carousel

**File:** `components/HeroCarousel.tsx`

```typescript
// Images are fetched from /api/banners
// To update banners, modify Banner document in MongoDB

// Database update example:
{
  desktopBanners: [
    {
      url: "https://res.cloudinary.com/...",
      cloudinaryPublicId: "banner_1",
      order: 1,
      link: "/shop/summer-collection"
    }
  ],
  mobileBanners: [
    {
      url: "https://res.cloudinary.com/...",
      cloudinaryPublicId: "banner_mobile_1",
      order: 1,
      link: "/shop/summer-collection"
    }
  ]
}
```

#### Update Featured Products

Featured products are controlled by the `featured` flag in Product documents:

```typescript
// Set product as featured
await Product.findByIdAndUpdate(productId, { featured: true });

// Remove from featured
await Product.findByIdAndUpdate(productId, { featured: false });
```

### 2.3 Updating SEO Metadata

#### Global SEO Settings

**File:** `app/metadata.ts`

```typescript
export const defaultMetadata: Metadata = {
  title: {
    default: 'Your Site Title',
    template: '%s | Your Brand',
  },
  description: 'Your site description',
  keywords: [
    'keyword1',
    'keyword2',
    // ... up to 20 keywords
  ],
  openGraph: {
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};
```

#### Page-Specific SEO

```typescript
// In any page.tsx
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
  },
};
```

### 2.4 Managing Navigation

#### Update Header Navigation

**File:** `components/Header.tsx`

```typescript
const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/new-page', label: 'New Page' }, // Add new link
];
```

#### Update Footer

**File:** `components/Footer.tsx`

```typescript
// Update footer links, social media, or contact info
const socialLinks = {
  instagram: 'https://instagram.com/yourhandle',
  facebook: 'https://facebook.com/yourpage',
  twitter: 'https://twitter.com/yourhandle',
};
```

---

## 3. Adding New Products

### 3.1 Product Data Structure

```typescript
interface Product {
  name: string;                    // "Oversized Vintage Tee"
  slug: string;                    // "oversized-vintage-tee"
  description: string;             // Full product description
  price: number;                   // 1999
  salePrice?: number;              // 1499 (optional)
  images: string[];                // Cloudinary URLs
  category: string;                // "mens"
  subcategory?: string;            // "tees"
  tags: string[];                  // ["oversized", "vintage"]
  sizes: string[];                 // ["S", "M", "L", "XL"]
  colors: string[];                // ["Black", "White"]
  inStock: boolean | boolean[];    // true or [true, false, true, true]
  stock: number | number[];        // 50 or [10, 0, 15, 20]
  featured: boolean;               // false
  newArrival: boolean;             // true
  color?: string;                  // "Black" (for details tab)
  fit?: string;                    // "Oversized"
  fabric?: string;                 // "100% Cotton"
  neck?: string;                   // "Round Neck"
  weight: number;                  // 300 (grams)
}
```

### 3.2 Adding Product via MongoDB

#### Option A: MongoDB Atlas UI

```
1. Go to MongoDB Atlas Dashboard
2. Navigate to Collections → products
3. Click "Insert Document"
4. Paste JSON:

{
  "name": "Product Name",
  "slug": "product-name",
  "description": "Product description...",
  "price": 1999,
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v123/product1.jpg"
  ],
  "category": "mens",
  "subcategory": "tees",
  "tags": ["oversized", "cotton"],
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["Black"],
  "inStock": true,
  "stock": 50,
  "featured": false,
  "newArrival": true,
  "weight": 300,
  "createdAt": "2026-02-11T00:00:00.000Z",
  "updatedAt": "2026-02-11T00:00:00.000Z"
}

5. Click "Insert"
```

#### Option B: Using API Script

Create `scripts/add-product.ts`:

```typescript
import { connectDB } from '../lib/mongodb';
import Product from '../lib/models/Product';

async function addProduct() {
  await connectDB();

  const product = new Product({
    name: 'Product Name',
    slug: 'product-name',
    description: 'Full description...',
    price: 1999,
    images: ['cloudinary-url'],
    category: 'mens',
    subcategory: 'tees',
    tags: ['oversized'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    inStock: true,
    stock: 50,
    featured: false,
    newArrival: true,
    weight: 300,
  });

  await product.save();
  console.log('Product added:', product.id);
}

addProduct();
```

Run with:

```bash
npx tsx scripts/add-product.ts
```

### 3.3 Uploading Product Images to Cloudinary

#### Via Cloudinary Dashboard

```
1. Log in to Cloudinary Dashboard
2. Navigate to Media Library
3. Click "Upload" → Select images
4. Organize in folder: /products/<product-slug>/
5. Copy image URLs
6. Add URLs to product.images array
```

#### Via Cloudinary Upload API

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadProductImage(imagePath: string, productSlug: string) {
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: `products/${productSlug}`,
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}
```

### 3.4 Per-Size Stock Management

For products with size-specific stock:

```typescript
{
  sizes: ['S', 'M', 'L', 'XL'],
  inStock: [true, true, false, true],  // L is out of stock
  stock: [10, 15, 0, 20]                // Quantities per size
}
```

When a size sells out:

```typescript
// Update specific size stock
const product = await Product.findById(productId);
const sizeIndex = product.sizes.indexOf('M');

product.stock[sizeIndex] -= quantity;

if (product.stock[sizeIndex] <= 0) {
  product.inStock[sizeIndex] = false;
}

await product.save();
```

---

## 4. Managing Users

### 4.1 User Roles

```typescript
enum UserRole {
  CUSTOMER = 'customer',      // Default role
  ADMIN = 'admin',            // Can manage products/orders
  SUPER_ADMIN = 'super-admin' // Full system access
}
```

### 4.2 Promoting User to Admin

```typescript
// Via MongoDB
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { role: 'admin' } }
);

// Via API script
import User from './lib/models/User';

async function promoteToAdmin(email: string) {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );
  console.log('User promoted:', user.email);
}
```

### 4.3 Viewing User Cart/Wishlist

```typescript
// Via MongoDB Atlas
db.users.findOne(
  { email: 'user@example.com' },
  { cart: 1, wishlist: 1 }
);

// Response shows:
{
  cart: [
    {
      productId: "prod_123",
      quantity: 2,
      selectedSize: "M",
      selectedColor: "Black"
    }
  ],
  wishlist: ["prod_456", "prod_789"]
}
```

### 4.4 Manually Adding Address

```typescript
const address = {
  id: crypto.randomUUID(),
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  addressLine2: 'Apt 4B',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'India',
  phone: '+91 9876543210',
  isDefault: true,
};

db.users.updateOne(
  { email: 'user@example.com' },
  { $push: { addresses: address } }
);
```

---

## 5. Order Management

### 5.1 Viewing Orders

```typescript
// All orders
db.orders.find().sort({ createdAt: -1 });

// User's orders
db.orders.find({ userId: 'firebase_uid' }).sort({ createdAt: -1 });

// Orders by status
db.orders.find({ orderStatus: 'processing' });

// Orders requiring attention
db.orders.find({
  orderStatus: { $in: ['processing', 'confirmed'] },
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
});
```

### 5.2 Updating Order Status Manually

```typescript
// Via MongoDB
db.orders.updateOne(
  { id: 'SUTR_A7K9M2' },
  { $set: { orderStatus: 'confirmed' } }
);

// Via API script
import Order from './lib/models/Order';

async function updateOrderStatus(orderId: string, status: string) {
  await connectDB();
  const order = await Order.findOneAndUpdate(
    { id: orderId },
    { orderStatus: status },
    { new: true }
  );
  console.log('Order updated:', order.id, '→', order.orderStatus);
}
```

### 5.3 Order Status Workflow

```
processing → confirmed → packed → shipped → out for delivery → delivered

Alternative flows:
processing → cancelled
shipped → returned (RTO)
```

### 5.4 Handling Order Issues

#### Refund an Order

```typescript
// 1. Update payment status
db.orders.updateOne(
  { id: 'SUTR_A7K9M2' },
  { $set: { paymentStatus: 'refunded' } }
);

// 2. Process refund via Razorpay Dashboard
// Navigate to Razorpay → Payments → Find payment → Issue Refund

// 3. Restore stock if needed
const order = await Order.findOne({ id: 'SUTR_A7K9M2' });
for (const item of order.items) {
  const product = await Product.findById(item.productId);
  
  if (Array.isArray(product.stock)) {
    const sizeIndex = product.sizes.indexOf(item.size);
    product.stock[sizeIndex] += item.quantity;
    product.inStock[sizeIndex] = true;
  } else {
    product.stock += item.quantity;
    product.inStock = true;
  }
  
  await product.save();
}
```

#### Cancel an Order

```typescript
async function cancelOrder(orderId: string, reason: string) {
  await connectDB();
  
  const order = await Order.findOne({ id: orderId });
  
  if (order.orderStatus === 'delivered') {
    throw new Error('Cannot cancel delivered order');
  }
  
  // Update order
  order.orderStatus = 'cancelled';
  order.internalNotes = `Cancelled: ${reason}`;
  await order.save();
  
  // Restore stock
  for (const item of order.items) {
    await restoreStock(item);
  }
  
  console.log('Order cancelled:', orderId);
}
```

### 5.5 Tracking Shipments

```typescript
// Find orders by AWB
db.orders.find({ 'shipping.awb': '12345678901234' });

// Find orders by tracking ID
db.orders.find({ 'shipping.trackingId': 'EKART_TRACK_123' });

// View shipping history
const order = await Order.findOne({ id: 'SUTR_A7K9M2' });
console.log(order.shipping.statusHistory);
```

---

## 6. Adding New Features

### 6.1 Creating a New Page

#### Step 1: Create Page File

```bash
# Create directory and file
mkdir -p app/new-page
touch app/new-page/page.tsx
```

#### Step 2: Add Page Content

**File:** `app/new-page/page.tsx`

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Page',
  description: 'Description of new page',
};

export default function NewPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">New Page</h1>
      <p>Page content here...</p>
    </div>
  );
}
```

#### Step 3: Add to Navigation

Update `components/Header.tsx`:

```typescript
const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/new-page', label: 'New Page' }, // Add this
];
```

#### Step 4: Add to Sitemap

**File:** `app/sitemap.ts`

```typescript
const staticPages = [
  // ... existing pages
  {
    url: `${baseUrl}/new-page`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
];
```

### 6.2 Adding a New API Route

#### Step 1: Create Route File

```bash
mkdir -p app/api/new-endpoint
touch app/api/new-endpoint/route.ts
```

#### Step 2: Implement Handler

**File:** `app/api/new-endpoint/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyIdToken } from '@/lib/firebase-admin';

// GET handler
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Your logic here
    const data = { message: 'Success' };
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST handler (protected)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    await connectDB();
    
    const body = await request.json();
    
    // Your logic here
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 6.3 Creating a New Database Model

#### Step 1: Define Schema

**File:** `lib/models/NewModel.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface INewModel extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewModelSchema = new Schema<INewModel>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes
NewModelSchema.index({ name: 1 });

// Methods
NewModelSchema.methods.customMethod = function() {
  // Custom instance method
};

// Statics
NewModelSchema.statics.customStaticMethod = function() {
  // Custom static method
};

const NewModel = mongoose.models.NewModel || 
  mongoose.model<INewModel>('NewModel', NewModelSchema);

export default NewModel;
```

#### Step 2: Create TypeScript Types

**File:** `types/index.d.ts`

```typescript
interface NewModelType {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

### 6.4 Adding a New Context Provider

#### Step 1: Create Context File

**File:** `lib/new-context.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NewContextType {
  data: any;
  loading: boolean;
  updateData: (newData: any) => void;
}

const NewContext = createContext<NewContextType | undefined>(undefined);

export function NewProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize data
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch data
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const updateData = (newData: any) => {
    setData(newData);
  };

  return (
    <NewContext.Provider value={{ data, loading, updateData }}>
      {children}
    </NewContext.Provider>
  );
}

export function useNewContext() {
  const context = useContext(NewContext);
  if (context === undefined) {
    throw new Error('useNewContext must be used within NewProvider');
  }
  return context;
}
```

#### Step 2: Add to Root Layout

**File:** `app/layout.tsx`

```typescript
import { NewProvider } from '@/lib/new-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NewProvider> {/* Add here */}
                {children}
              </NewProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 6.5 Adding a New Filter to Shop Page

#### Step 1: Update API Route

**File:** `app/api/shop/route.ts`

```typescript
// Add new query parameter handling
const newFilter = searchParams.get('newFilter');

const query: any = {};

if (newFilter) {
  query.newField = newFilter; // Add to query
}
```

#### Step 2: Update Shop Page UI

**File:** `app/shop/page.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function ShopPage() {
  const [newFilter, setNewFilter] = useState('');

  const applyFilter = () => {
    const params = new URLSearchParams();
    if (newFilter) params.set('newFilter', newFilter);
    
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div>
      {/* Filter UI */}
      <select value={newFilter} onChange={(e) => setNewFilter(e.target.value)}>
        <option value="">All</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
      
      <button onClick={applyFilter}>Apply Filters</button>
    </div>
  );
}
```

---

## 7. UI Components Guide

### 7.1 Using Existing Components

#### Button Component

```typescript
import Button from '@/components/Button';

<Button variant="primary" fullWidth onClick={handleClick}>
  Click Me
</Button>

// Variants: primary, secondary, outline, danger
```

#### Loading Component

```typescript
import { PageLoading, InlineLoading } from '@/components/Loading';

// Full page loading
<PageLoading text="Loading..." />

// Inline loading (for buttons)
<button disabled>
  {loading ? <InlineLoading /> : 'Submit'}
</button>
```

#### Notification System

```typescript
import { useNotification } from '@/components/Notification';

function MyComponent() {
  const { showNotification } = useNotification();

  const handleSuccess = () => {
    showNotification('Operation successful!', 'success', 3000);
  };

  const handleError = () => {
    showNotification('Something went wrong', 'error', 5000);
  };

  // Types: success, error, warning, info
}
```

### 7.2 Creating Custom Components

#### Basic Component Template

**File:** `components/MyComponent.tsx`

```typescript
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

const MyComponent: FC<MyComponentProps> = ({
  title,
  description,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'p-4 border rounded-lg',
        'hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <h3 className="text-xl font-bold">{title}</h3>
      {description && <p className="text-gray-600 mt-2">{description}</p>}
    </div>
  );
};

export default MyComponent;
```

#### Client Component with State

```typescript
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 7.3 Styling Guidelines

```typescript
// Use Tailwind utility classes
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <span className="text-sm text-gray-500">Subtitle</span>
</div>

// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-lg',
    isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Button
</button>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

---

## 8. Database Operations

### 8.1 Connecting to MongoDB

```bash
# Via MongoDB Compass
mongodb+srv://username:password@cluster.mongodb.net/database

# Via MongoDB Shell
mongosh "mongodb+srv://cluster.mongodb.net/database" --username username
```

### 8.2 Common Database Queries

#### Products

```javascript
// Find all in-stock products
db.products.find({ inStock: true });

// Find products by category
db.products.find({ category: 'mens', subcategory: 'tees' });

// Find featured products
db.products.find({ featured: true });

// Search by name
db.products.find({ name: /vintage/i });

// Update product price
db.products.updateOne(
  { slug: 'product-slug' },
  { $set: { price: 1999, salePrice: 1499 } }
);

// Add new size to product
db.products.updateOne(
  { slug: 'product-slug' },
  { $push: { sizes: 'XXL' } }
);

// Bulk update category
db.products.updateMany(
  { category: 'old-category' },
  { $set: { category: 'new-category' } }
);
```

#### Users

```javascript
// Find user by email
db.users.findOne({ email: 'user@example.com' });

// Find users with items in cart
db.users.find({ 'cart.0': { $exists: true } });

// Find users who subscribed to newsletter
db.users.find({ 'preferences.newsletter': true });

// Clear user's cart
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { cart: [] } }
);

// Add to wishlist
db.users.updateOne(
  { firebaseUid: 'uid' },
  { $addToSet: { wishlist: 'product_id' } }
);
```

#### Orders

```javascript
// Find orders from last 7 days
db.orders.find({
  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});

// Find pending orders
db.orders.find({ orderStatus: 'processing' });

// Find orders above certain amount
db.orders.find({ total: { $gte: 5000 } });

// Update shipping status
db.orders.updateOne(
  { id: 'SUTR_A7K9M2' },
  {
    $set: { 'shipping.status': 'Delivered' },
    $push: {
      'shipping.statusHistory': {
        status: 'Delivered',
        timestamp: new Date(),
        location: 'Mumbai Hub'
      }
    }
  }
);
```

### 8.3 Database Backup

```bash
# Export entire database
mongodump --uri="mongodb+srv://..." --out=/backup/2026-02-11

# Export specific collection
mongodump --uri="mongodb+srv://..." --collection=products --out=/backup

# Import database
mongorestore --uri="mongodb+srv://..." /backup/2026-02-11

# Import specific collection
mongorestore --uri="mongodb+srv://..." --collection=products /backup/products.bson
```

### 8.4 Data Migration Scripts

**Example:** Migrate price format

```typescript
// scripts/migrate-prices.ts
import { connectDB } from '../lib/mongodb';
import Product from '../lib/models/Product';

async function migratePrices() {
  await connectDB();

  const products = await Product.find({});

  for (const product of products) {
    // Convert price from string to number (example)
    if (typeof product.price === 'string') {
      product.price = parseFloat(product.price);
      await product.save();
      console.log(`Updated product: ${product.slug}`);
    }
  }

  console.log('Migration complete');
}

migratePrices();
```

---

## 9. Deployment Guide

### 9.1 Pre-Deployment Checklist

```
☐ All environment variables set in production
☐ Database indexes created
☐ Images uploaded to Cloudinary
☐ Payment gateway in live mode
☐ Shipping credentials verified
☐ Email service configured
☐ Domain DNS configured
☐ SSL certificate active
☐ Error tracking setup (Sentry)
☐ Analytics configured (Google Analytics)
```

### 9.2 Deploying to Vercel

#### Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Via Vercel Dashboard

```
1. Go to vercel.com
2. Click "Add New" → "Project"
3. Import Git repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
5. Add environment variables
6. Click "Deploy"
```

### 9.3 Environment Variables Setup

```bash
# In Vercel Dashboard:
# Settings → Environment Variables

# Add each variable:
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_ADMIN_PRIVATE_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
# ... all other variables
```

### 9.4 Custom Domain Setup

```
1. Vercel Dashboard → Settings → Domains
2. Add domain: yourdomain.com
3. Add DNS records at your domain provider:
   
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

4. Wait for DNS propagation (up to 48 hours)
5. Vercel automatically provisions SSL
```

### 9.5 Post-Deployment Verification

```
☐ Homepage loads correctly
☐ Shop page displays products
☐ User registration works
☐ Login works
☐ Cart operations work
☐ Checkout flow completes
☐ Payment processing works
☐ Order confirmation received
☐ Email notifications sent
☐ Shipment created
☐ Images load from Cloudinary
☐ SEO metadata correct
☐ Mobile responsive
☐ PWA installable
```

---

## 10. Troubleshooting

### 10.1 Common Issues & Solutions

#### Database Connection Errors

```
Error: MongooseServerSelectionError: connect ECONNREFUSED

Solutions:
1. Check MONGODB_URI in .env.local
2. Verify IP whitelist in MongoDB Atlas (0.0.0.0/0 for Vercel)
3. Check network connection
4. Verify database user credentials
```

#### Firebase Auth Errors

```
Error: Firebase: Error (auth/invalid-api-key)

Solutions:
1. Check NEXT_PUBLIC_FIREBASE_API_KEY
2. Verify API key in Firebase Console
3. Ensure environment variables are prefixed with NEXT_PUBLIC_
4. Rebuild app after adding env vars
```

#### Payment Failures

```
Error: Payment signature verification failed

Solutions:
1. Verify RAZORPAY_KEY_SECRET matches dashboard
2. Check that amount is in paise (multiply by 100)
3. Ensure order ID matches between create and verify
4. Check Razorpay is in live mode (for production)
```

#### Image Upload Issues

```
Error: Cloudinary upload failed

Solutions:
1. Verify CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
2. Check image file size (max 10MB)
3. Verify cloud name is correct
4. Check upload preset allows unsigned uploads
```

#### Shipping API Errors

```
Error: Ekart API returns 401 Unauthorized

Solutions:
1. Verify EKART_CLIENT_ID, EKART_USERNAME, EKART_PASSWORD
2. Check if token is expired (tokens last 24 hours)
3. Ensure pickup location is registered in Ekart
4. Verify pincode is serviceable
```

### 10.2 Debugging Steps

#### Check Server Logs

```bash
# Local development
# Check terminal where npm run dev is running

# Production (Vercel)
# Dashboard → Deployments → Select deployment → Runtime Logs
```

#### Enable Debug Logging

```typescript
// lib/logger.ts
// Set to true for development debugging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug info:', data);
}
```

#### Test API Endpoints

```bash
# Using curl
curl -X GET http://localhost:3000/api/shop

# Using httpie
http GET http://localhost:3000/api/shop

# Using Postman
# Import collection and test endpoints
```

#### Database Query Testing

```javascript
// In MongoDB Compass or Atlas
// Use "Explain" tab to analyze query performance
db.products.find({ category: 'mens' }).explain('executionStats');

// Check indexes
db.products.getIndexes();
```

### 10.3 Performance Issues

#### Slow Page Loads

```
Diagnostics:
1. Check Network tab in DevTools
2. Identify slow API calls
3. Check image sizes
4. Verify Cloudinary optimization

Solutions:
1. Add loading states
2. Implement pagination
3. Use image optimization (next/image)
4. Enable caching headers
5. Lazy load below-the-fold content
```

#### High Database Latency

```
Solutions:
1. Add missing indexes
2. Optimize queries (use projections)
3. Implement server-side caching
4. Upgrade MongoDB cluster tier
5. Use connection pooling
```

---

## 11. Maintenance Tasks

### 11.1 Regular Maintenance

#### Daily Tasks

```
☐ Check order status updates
☐ Monitor shipping webhooks
☐ Review failed payments
☐ Check error logs
```

#### Weekly Tasks

```
☐ Review low stock products
☐ Update featured products
☐ Check for abandoned carts
☐ Review user registrations
☐ Monitor site performance
```

#### Monthly Tasks

```
☐ Database backup
☐ Update dependencies (npm update)
☐ Review analytics
☐ Clean up old logs
☐ Audit security
☐ Review and update content
```

### 11.2 Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update next

# Update to latest (breaking changes)
npm install next@latest react@latest react-dom@latest

# After updates, test thoroughly
npm run build
npm run lint
```

### 11.3 Database Maintenance

#### Clean Up Old Data

```javascript
// Remove expired carts (older than 30 days)
db.users.updateMany(
  {},
  {
    $pull: {
      cart: {
        addedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    }
  }
);

// Archive old orders
db.orders_archive.insertMany(
  db.orders.find({
    createdAt: { $lt: new Date('2025-01-01') }
  }).toArray()
);

db.orders.deleteMany({
  createdAt: { $lt: new Date('2025-01-01') }
});
```

#### Optimize Indexes

```javascript
// Rebuild indexes
db.products.reIndex();
db.users.reIndex();
db.orders.reIndex();

// Check index usage
db.products.aggregate([
  { $indexStats: {} }
]);
```

### 11.4 Security Audits

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Manual fix for breaking changes
npm audit fix --force

# Review security advisories
npm audit --production
```

### 11.5 Backup Strategy

```bash
# Automated daily backups (via cron or GitHub Actions)
# .github/workflows/backup.yml

name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup MongoDB
        run: |
          mongodump --uri="${{ secrets.MONGODB_URI }}" --out=/tmp/backup
          
      - name: Upload to S3/Cloud Storage
        run: |
          aws s3 cp /tmp/backup s3://backups/$(date +%Y-%m-%d)/ --recursive
```

### 11.6 Monitoring & Alerts

#### Set Up Error Tracking (Sentry)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Use in error boundaries and catch blocks
try {
  // ... operation
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

#### Set Up Uptime Monitoring

```
Services:
- UptimeRobot (uptimerobot.com)
- Pingdom (pingdom.com)
- Vercel Analytics (built-in)

Monitor:
- Homepage: https://sutr.store
- API health: https://sutr.store/api/health
- Payment gateway status
```

---

## Appendix A: Quick Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Lint code

# Database
npx tsx scripts/seed.ts  # Seed database
npx tsx scripts/migrate.ts  # Run migrations

# Deployment
vercel                   # Deploy preview
vercel --prod            # Deploy production
vercel logs              # View logs

# Testing
npm test                 # Run tests (if configured)
npm run type-check       # TypeScript check
```

---

## Appendix B: Useful Scripts

### Bulk Update Products

```typescript
// scripts/bulk-update-products.ts
import { connectDB } from '../lib/mongodb';
import Product from '../lib/models/Product';

async function bulkUpdateProducts() {
  await connectDB();

  // Example: Add new tag to all products
  await Product.updateMany(
    {},
    { $addToSet: { tags: 'sustainable' } }
  );

  console.log('Products updated');
}

bulkUpdateProducts();
```

### Generate Dummy Orders

```typescript
// scripts/generate-test-orders.ts
import { connectDB } from '../lib/mongodb';
import Order from '../lib/models/Order';

async function generateTestOrders(count: number) {
  await connectDB();

  for (let i = 0; i < count; i++) {
    const order = new Order({
      id: `TEST_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      userId: 'test_user',
      items: [
        {
          productId: 'test_product',
          productName: 'Test Product',
          price: 1999,
          quantity: 1,
        },
      ],
      total: 1999,
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        phone: '+91 9876543210',
      },
    });

    await order.save();
  }

  console.log(`Generated ${count} test orders`);
}

generateTestOrders(10);
```

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
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Ekart Logistics
EKART_API_URL=https://app.elite.ekartlogistics.in
EKART_CLIENT_ID=your_client_id
EKART_USERNAME=your_username
EKART_PASSWORD=your_password
EKART_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Warehouse
WAREHOUSE_NAME=Sutr Warehouse
WAREHOUSE_ADDRESS=Your warehouse address
WAREHOUSE_CITY=Mumbai
WAREHOUSE_STATE=Maharashtra
WAREHOUSE_PINCODE=400001
WAREHOUSE_PHONE=+91 9876543210

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.6.2 | Feb 11, 2026 | [Itesh Tomar](https://github.com/iteshxt) | Initial operational guide created |

---

*For technical architecture details, refer to [ARCHITECTURE-SUTR.STORE.md](./ARCHITECTURE-SUTR.STORE.md)*

*For questions or issues, contact the development team or create an issue in the repository.*
