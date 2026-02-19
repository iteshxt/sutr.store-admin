# Sutr Clothing Admin Panel - Technical Architecture Guide
> **Version:** 1.5.0  
> **Last Updated:** February 19, 2026  
> **Author:** [Itesh Tomar](https://github.com/iteshxt)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Stack](#2-technical-stack)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Directory Structure](#4-directory-structure)
5. [Authentication System](#5-authentication-system)
6. [Dashboard & Analytics](#6-dashboard--analytics)
7. [Product Management](#7-product-management)
8. [Order Management](#8-order-management)
9. [Customer Management](#9-customer-management)
10. [Banner Management](#10-banner-management)
11. [Reports & Statistics](#11-reports--statistics)
12. [Database Models](#12-database-models)
13. [API Reference](#13-api-reference)
14. [Security Implementation](#14-security-implementation)
15. [Session Management](#15-session-management)
16. [Image Upload System](#16-image-upload-system)
17. [Environment Configuration](#17-environment-configuration)
18. [Deployment Considerations](#18-deployment-considerations)

---

## 1. Project Overview

### 1.1 System Description

**Sutr Admin Panel** is the administrative dashboard for the Sutr Clothing e-commerce platform. It provides authenticated administrators with comprehensive tools for managing products, orders, customers, banners, and viewing business analytics.

### 1.2 Relationship to Main Platform

```
 ┌─────────────────────────────────────────────────────────────────┐
  │                      SUTR ECOSYSTEM                             │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │   ┌─────────────────────────┐    ┌─────────────────────────┐    │
  │   │     sutr.store          │    │   sutr.store-admin      │    │
  │   │  (Customer Platform)    │    │   (Admin Dashboard)     │    │
  │   │                         │    │                         │    │
  │   │  • Browse Products      │    │  • Manage Products      │    │
  │   │  • Shopping Cart        │    │  • Process Orders       │    │
  │   │  • Checkout & Pay       │    │  • View Analytics       │    │
  │   │  • Order History        │    │  • Manage Customers     │    │
  │   │  • User Accounts        │    │  • Update Banners       │    │
  │   └───────────┬─────────────┘    └───────────┬─────────────┘    │
  │               │                              │                  │
  │               └──────────────┬───────────────┘                  │
  │                              │                                  │
  │                              ▼                                  │
  │               ┌─────────────────────────────┐                   │
  │               │      SHARED RESOURCES       │                   │
  │               │                             │                   │
  │               │  • MongoDB Atlas (Database) │                   │
  │               │  • Firebase Auth            │                   │
  │               │  • Cloudinary (Images)      │                   │
  │               └─────────────────────────────┘                   │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### 1.3 Core Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time stats, growth metrics, recent orders, status breakdown |
| **Product Management** | Full CRUD, image upload, stock management, categorization |
| **Order Management** | View orders, update status, track shipments |
| **Customer Management** | View customer profiles, order history |
| **Banner Management** | Upload/manage homepage banners (mobile + desktop) |
| **Reports** | Sales reports, order analytics |
| **Statistics** | Visual charts, trend analysis |
| **Profile Management** | Admin profile settings |

### 1.4 Admin Users

The admin panel is restricted to users with Firebase custom claims:

- `admin: true` - Required to access the dashboard
- Created via CLI script: `scripts/create-admin.js`

---

## 2. Technical Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework with App Router |
| **React** | 19.x | UI library with Server Components |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Recharts** | 2.x | Analytics & chart visualizations |
| **Headless UI** | 2.x | Accessible UI primitives |
| **Heroicons** | 2.x | SVG icon library |

### 2.2 Backend

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **MongoDB** | NoSQL database (shared with main platform) |
| **Mongoose** | MongoDB ODM |
| **Firebase Admin SDK** | Server-side auth verification |

### 2.3 External Services

| Service | Purpose |
|---------|---------|
| **Firebase Auth** | Admin authentication |
| **MongoDB Atlas** | Cloud database (shared) |
| **Cloudinary** | Product & banner image hosting |

### 2.4 Development Tools

```
├── ESLint          → Code linting
├── TypeScript      → Static type checking
├── Turbopack       → Fast development bundler
└── PostCSS         → CSS processing
```

### 2.5 Package Dependencies

```json
// Key dependencies from package.json
{
  "dependencies": {
    "next": "^15.1.8",
    "react": "^19.0.0",
    "firebase": "^11.7.1",
    "firebase-admin": "^13.4.0",
    "mongoose": "^8.12.1",
    "cloudinary": "^2.5.1",
    "recharts": "^2.15.3",
    "@headlessui/react": "^2.2.4",
    "@heroicons/react": "^2.2.0"
  }
}
```

---

## 3. Architecture Patterns

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN BROWSER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ AuthContext │  │ToastContext │  │SessionTimer │  React       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  Context     │
│         │                │                │                     │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              ClientLayout                     │  Route       │
│  │       (AuthGuard + Sidebar + Content)         │  Protection  │
│  └──────────────────────┬────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────┘
                          │ API Calls (Bearer Token)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes (/api)                    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  /dashboard  │ /products  │ /orders   │ /users          │    │
│  │  /banners    │ /reports   │ /upload   │ /profile        │    │
│  │  /categories │ /statistics│ /site-settings              │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐    │
│  │              Admin Auth Verification                    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  verifyAdminAuth() │ verifyAdminToken() │ getAuthUser() │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐    │
│  │              Server-Side Services                       │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  Firebase Admin │ Mongoose Models │ Cloudinary Upload   │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌────────────┐    ┌────────────────┐   ┌────────────┐
   │  MongoDB   │    │ Firebase Auth  │   │ Cloudinary │
   │   Atlas    │    │    Service     │   │   Images   │
   └────────────┘    └────────────────┘   └────────────┘
```

### 3.2 Provider Hierarchy

```typescript
// app/layout.tsx - Provider nesting order
<AuthProvider>
  <ToastProvider>
    <ClientLayout>
      {children}  // Page components
    </ClientLayout>
  </ToastProvider>
</AuthProvider>
```

### 3.3 Route Protection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ROUTE PROTECTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User Request                                                  │
│       │                                                         │
│       ▼                                                         │
│   ┌──────────────────┐                                          │
│   │   Is /login?     │ ────── Yes ──────► Show Login Page       │
│   └────────┬─────────┘                                          │
│            │ No                                                 │
│            ▼                                                    │
│   ┌──────────────────┐                                          │
│   │   AuthGuard      │                                          │
│   │   Check Auth     │                                          │
│   └────────┬─────────┘                                          │
│            │                                                    │
│   ┌────────┴────────┐                                           │
│   │                 │                                           │
│   ▼                 ▼                                           │
│ Loading?         Authenticated?                                 │
│   │                 │                                           │
│   ▼              No │                                           │
│ Show             ───┼───────────► Redirect to /login            │
│ Spinner             │ Yes                                       │
│                     ▼                                           │
│               ┌──────────────────┐                              │
│               │   isAdmin?       │                              │
│               └────────┬─────────┘                              │
│                   No   │  Yes                                   │
│                   ▼    │                                        │
│          Redirect to   │                                        │
│          /unauthorized ▼                                        │
│                   Show Protected Page                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                CLIENT LAYOUT COMPONENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ClientLayout                                                  │
│   ├── AuthGuard (route protection)                              │
│   ├── SessionTimeout Hook (auto-logout)                         │
│   │   └── Warning Modal (55-60 minute countdown)                │
│   ├── Sidebar                                                   │
│   │   ├── Logo                                                  │
│   │   ├── Navigation Links                                      │
│   │   │   ├── Dashboard                                         │
│   │   │   ├── Products                                          │
│   │   │   ├── Orders                                            │
│   │   │   ├── Customers                                         │
│   │   │   ├── Reports                                           │
│   │   │   └── Statistics                                        │
│   │   ├── Profile Link                                          │
│   │   └── Sign Out Button                                       │
│   └── Main Content Area                                         │
│       └── {children} - Page components                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
sutr.store-admin/
├── app/                          # Next.js App Router
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout with providers
│   ├── loading.tsx               # Global loading UI
│   ├── page.tsx                  # Dashboard (homepage)
│   │
│   ├── api/                      # API Routes
│   │   ├── banners/
│   │   │   ├── route.ts          # GET/POST banners
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET/PUT/DELETE banner
│   │   ├── categories/
│   │   │   └── route.ts          # GET distinct categories
│   │   ├── dashboard/
│   │   │   └── stats/
│   │   │       └── route.ts      # Dashboard analytics
│   │   ├── orders/
│   │   │   ├── route.ts          # GET all orders
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET/PUT single order
│   │   ├── products/
│   │   │   ├── route.ts          # GET/POST products
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET/PUT/DELETE product
│   │   ├── profile/
│   │   │   └── route.ts          # GET/PUT admin profile
│   │   ├── reports/
│   │   │   └── route.ts          # Sales reports
│   │   ├── site-settings/
│   │   │   └── route.ts          # Maintenance mode
│   │   ├── statistics/
│   │   │   └── route.ts          # Chart data
│   │   ├── upload/
│   │   │   └── route.ts          # Image upload
│   │   └── users/
│   │       ├── route.ts          # GET all users
│   │       └── [id]/
│   │           ├── route.ts      # GET/DELETE user
│   │           └── orders/
│   │               └── route.ts  # User's order history
│   │
│   ├── customers/
│   │   └── page.tsx              # Customer list page
│   ├── login/
│   │   └── page.tsx              # Admin login page
│   ├── orders/
│   │   └── page.tsx              # Order management page
│   ├── products/
│   │   ├── page.tsx              # Product list page
│   │   ├── new/
│   │   │   └── page.tsx          # Create product page
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx      # Edit product page
│   ├── profile/
│   │   └── page.tsx              # Admin profile page
│   ├── reports/
│   │   └── page.tsx              # Reports page
│   ├── statistics/
│   │   └── page.tsx              # Statistics charts page
│   └── unauthorized/
│       └── page.tsx              # Unauthorized access page
│
├── components/                   # Reusable UI components
│   ├── AuthGuard.tsx             # Route protection wrapper
│   ├── BannerUploadModal.tsx     # Banner management modal
│   ├── ClientLayout.tsx          # Main layout with sidebar
│   ├── ImageUpload.tsx           # Product image uploader
│   ├── LoginForm.tsx             # Login form component
│   ├── Logo.tsx                  # Brand logo component
│   ├── OrderDetailsModal.tsx     # Order details popup
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── Toast.tsx                 # Toast notification
│   └── ToastProvider.tsx         # Toast context provider
│
├── lib/                          # Shared utilities
│   ├── auth-admin.ts             # Admin auth verification
│   ├── auth-context.tsx          # Auth state provider
│   ├── firebase-admin.ts         # Firebase Admin SDK setup
│   ├── firebase.ts               # Firebase client setup
│   ├── mongodb.ts                # MongoDB connection
│   ├── upload-images.ts          # Cloudinary upload helper
│   ├── use-session-timeout.ts    # Session timeout hook
│   ├── utils.ts                  # Helper functions
│   └── models/                   # Mongoose schemas
│       ├── Banner.ts
│       ├── Order.ts
│       ├── Product.ts
│       ├── SiteSettings.ts
│       └── User.ts
│
├── public/                       # Static assets
│   └── images/
│       └── logo/                 # Brand logos
│
├── scripts/                      # CLI utilities
│   └── create-admin.js           # Admin user provisioning
│
├── types/                        # TypeScript definitions
│   └── index.d.ts                # Global type interfaces
│
└── Configuration Files
    ├── next.config.ts            # Next.js configuration
    ├── tailwind.config.ts        # Tailwind configuration
    ├── tsconfig.json             # TypeScript configuration
    ├── eslint.config.mjs         # ESLint configuration
    ├── postcss.config.mjs        # PostCSS configuration
    └── package.json              # Dependencies
```

---

## 5. Authentication System

### 5.1 Authentication Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN AUTHENTICATION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │ Admin Login  │ /login page                                  │
│   │ (Email/Pass) │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                      │
│   │        Firebase Authentication        │                     │
│   │    signInWithEmailAndPassword()       │                     │
│   └──────────────────────────┬───────────┘                      │
│                              │                                  │
│                              ▼                                  │
│          ┌──────────────────────────────┐                       │
│          │   Get ID Token Result        │                       │
│          │   user.getIdTokenResult()    │                       │
│          └──────────────────┬───────────┘                       │
│                             │                                   │
│                             ▼                                   │
│          ┌──────────────────────────────┐                       │
│          │   Check admin Claim          │                       │
│          │   claims.admin === true?     │                       │
│          └──────────────────┬───────────┘                       │
│                    No       │  Yes                              │
│                    ▼        │                                   │
│          ┌─────────────┐    ▼                                   │
│          │Sign Out &   │  ┌──────────────────┐                  │
│          │Show Error   │  │ Set User State   │                  │
│          │"No Admin    │  │ Set isAdmin=true │                  │
│          │ Access"     │  │ Redirect to /    │                  │
│          └─────────────┘  └──────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Firebase Client Setup

**File:** `lib/firebase.ts`

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

export const auth = getAuth(app);
```

### 5.3 Firebase Admin Setup

**File:** `lib/firebase-admin.ts`

```typescript
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (server-side only)
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();
```

### 5.4 Auth Context Provider

**File:** `lib/auth-context.tsx`

```typescript
interface AuthContextType {
  user: User | null;          // Firebase user object
  loading: boolean;           // Auth state loading
  isAdmin: boolean;           // Has admin claim
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Login Flow
const signIn = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const tokenResult = await result.user.getIdTokenResult();
  
  // CRITICAL: Verify admin claim
  if (tokenResult.claims.admin !== true) {
    await firebaseSignOut(auth);
    throw new Error('You do not have admin access');
  }
  
  router.push('/');
};
```

### 5.5 Admin Auth Verification (Server-Side)

**File:** `lib/auth-admin.ts`

```typescript
// Verify request has admin authorization
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  return decodedToken.admin === true;
}

// Get admin user details from token
export async function verifyAdminToken(token: string) {
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  if (decodedToken.admin !== true) return null;
  
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    admin: true,
  };
}

// Get any authenticated user (admin or not)
export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await adminAuth.verifyIdToken(token);

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    admin: decodedToken.admin === true,
  };
}
```

### 5.6 Auth Guard Component

**File:** `components/AuthGuard.tsx`

```typescript
export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Redirect to unauthorized if not admin
  if (!isAdmin) {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}
```

### 5.7 Admin User Provisioning

**File:** `scripts/create-admin.js`

CLI script to create admin users with custom claims:

```bash
# Usage
node scripts/create-admin.js admin@sutr.store password123

# What it does:
# 1. Creates Firebase user with email/password
# 2. Sets custom claim: { admin: true }
# 3. Creates corresponding MongoDB user document
```

---

## 6. Dashboard & Analytics

### 6.1 Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD DATA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Dashboard Page (app/page.tsx)                                 │
│       │                                                         │
│       │ fetchDashboardData()                                    │
│       │ GET /api/dashboard/stats                                │
│       ▼                                                         │
│   ┌──────────────────────────────────────┐                      │
│   │         Dashboard Stats API          │                      │
│   │   (app/api/dashboard/stats/route.ts) │                      │
│   └──────────────────────────────────────┘                      │
│       │                                                         │
│       │ Query MongoDB                                           │
│       ▼                                                         │
│   ┌──────────────────────────────────────────────────┐          │
│   │               MongoDB Queries                    │          │
│   │  ┌────────────────┐  ┌────────────────┐          │          │
│   │  │ Order.find()   │  │ User.count()   │          │          │
│   │  │ - All orders   │  │ - Total users  │          │          │
│   │  │ - Sum totals   │  │ - Growth calc  │          │          │
│   │  └────────────────┘  └────────────────┘          │          │
│   │  ┌────────────────┐  ┌────────────────┐          │          │
│   │  │ Product.count()│  │ Order.find()   │          │          │
│   │  │ - Total prods  │  │ - Recent 10    │          │          │
│   │  └────────────────┘  └────────────────┘          │          │
│   └──────────────────────────────────────────────────┘          │
│       │                                                         │
│       ▼ Returns                                                 │
│   ┌──────────────────────────────────────────────────┐          │
│   │  {                                               │          │
│   │    stats: { totalSales, totalOrders, ... },      │          │
│   │    recentOrders: [...],                          │          │
│   │    pendingOrdersCount: number,                   │          │
│   │    topProduct: { name, count },                  │          │
│   │    statusBreakdown: { pending, shipped, ... }    │          │
│   │  }                                               │          │
│   └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard Stats Structure

**Endpoint:** `GET /api/dashboard/stats`

```typescript
// Response structure
{
  success: true,
  stats: {
    totalSales: number,        // Sum of all order totals
    totalOrders: number,       // Count of all orders
    totalCustomers: number,    // Count of all users
    totalProducts: number,     // Count of all products
    salesGrowth: string,       // "15.5" (percentage)
    ordersGrowth: string,      // "8.2" (percentage)
    customersGrowth: string,   // "12.0" (percentage)
  },
  recentOrders: [              // Last 10 orders
    {
      _id: string,
      orderNumber: string,
      customerName: string,
      customerEmail: string,
      total: number,
      status: string,
      createdAt: Date,
      itemCount: number,
    }
  ],
  pendingOrdersCount: number,  // Orders not yet delivered
  topProduct: {
    name: string,              // Best selling product name
    count: number,             // Units sold this month
  },
  statusBreakdown: {
    pending: number,
    processing: number,
    shipped: number,
    outForDelivery: number,
    delivered: number,
    cancelled: number,
  }
}
```

### 6.3 Growth Calculation Logic

```typescript
// Growth is calculated by comparing last 30 days vs previous 30 days

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

// Current period: last 30 days
// Previous period: 30-60 days ago

// Growth formula:
let growth = 0;
if (previousValue === 0 && currentValue > 0) {
  growth = 100;  // First time data
} else if (previousValue > 0) {
  growth = ((currentValue - previousValue) / previousValue) * 100;
}
```

### 6.4 Dashboard UI Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD LAYOUT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Header: "Dashboard" + Last Updated + Refresh Button    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐  │
│  │ Total Sales  │ │ Total Orders │ │ Customers    │ │Products│  │
│  │   ₹50,000    │ │     125      │ │     89       │ │   45   │  │
│  │   +15.5%     │ │   +8.2%      │ │   +12.0%     │ │  N/A   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘  │
│                                                                 │
│  ┌──────────────────────────┐  ┌────────────────────────────┐   │
│  │     Quick Stats          │  │      Status Breakdown      │   │
│  │  • Pending: 12           │  │  • Pending: 5              │   │
│  │  • Top Product: Hoodie   │  │  • Processing: 3           │   │
│  │    (25 sold)             │  │  • Shipped: 15             │   │
│  └──────────────────────────┘  │  • Delivered: 102          │   │
│                                └────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Recent Orders                         │    │
│  │  ┌──────────┬──────────┬────────┬────────┬─────────┐    │    │
│  │  │ Order #  │ Customer │ Total  │ Status │ Date    │    │    │
│  │  ├──────────┼──────────┼────────┼────────┼─────────┤    │    │
│  │  │ SUTR_... │ John Doe │ ₹1,999 │Pending │ Feb 19  │    │    │
│  │  │ SUTR_... │ Jane Doe │ ₹2,499 │Shipped │ Feb 18  │    │    │
│  │  └──────────┴──────────┴────────┴────────┴─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Product Management

### 7.1 Product CRUD Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   PRODUCT MANAGEMENT FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Products List (/products)                                     │
│       │                                                         │
│       ├──── View ────► Product Table with filters               │
│       │                 • Search by name                        │
│       │                 • Filter by category                    │
│       │                 • Filter by stock status                │
│       │                 • Sort options                          │
│       │                                                         │
│       ├──── Create ──► /products/new                            │
│       │                 │                                       │
│       │                 ▼                                       │
│       │            Product Form                                 │
│       │                 │                                       │
│       │                 ├── Upload Images (Cloudinary)          │
│       │                 │     POST /api/upload                  │
│       │                 │                                       │
│       │                 └── Submit Product                      │
│       │                       POST /api/products                │
│       │                       │                                 │
│       │                       ▼                                 │
│       │                   MongoDB Insert                        │
│       │                                                         │
│       ├──── Edit ────► /products/[id]/edit                      │
│       │                 │                                       │
│       │                 ├── Load product data                   │
│       │                 │     GET /api/products/[id]            │
│       │                 │                                       │
│       │                 ├── Update images (optional)            │
│       │                 │                                       │
│       │                 └── Submit updates                      │
│       │                       PUT /api/products/[id]            │
│       │                                                         │
│       └──── Delete ──► Confirmation Modal                       │
│                         │                                       │
│                         └── DELETE /api/products/[id]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Product Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | ✓ | Min 3 chars |
| `description` | string | ✓ | Min 10 chars |
| `price` | number | ✓ | > 0 |
| `salePrice` | number | - | < price |
| `category` | string | ✓ | From categories list |
| `subcategory` | string | ✓ | - |
| `images` | string[] | ✓ | Min 1 image URL |
| `sizes` | string[] | - | e.g., ['S', 'M', 'L'] |
| `colors` | string[] | - | e.g., ['Black', 'White'] |
| `stock` | number[] | - | Per-size stock quantities |
| `inStock` | boolean[] | - | Per-size availability |
| `featured` | boolean | - | Mutually exclusive with newArrival |
| `newArrival` | boolean | - | Mutually exclusive with featured |
| `productDetails` | object | - | Key-value specifications |

### 7.3 Product Validation Rules

```typescript
// Server-side validation in POST /api/products

// 1. Required fields
if (!name || !description || !price || !category || !subcategory) {
  return error(400, 'Missing required fields');
}

// 2. Stock array must match sizes array
if (stock?.length !== sizes?.length) {
  return error(400, 'Stock array length must match sizes array length');
}

// 3. Featured/NewArrival mutual exclusivity
if (featured && newArrival) {
  return error(400, 'Product cannot be both featured and new arrival');
}

// 4. Auto-generate slug from name
const slug = generateSlug(name);
```

### 7.4 Stock Management Models

**Model A: Per-Size Stock (Arrays)**

```typescript
{
  sizes: ['S', 'M', 'L', 'XL'],
  inStock: [true, true, false, true],   // Per-size availability
  stock: [10, 15, 0, 8],                 // Per-size quantities
}
// Used for clothing with multiple sizes
```

**Model B: General Stock (Single Values)**

```typescript
{
  sizes: [],
  inStock: true,
  stock: 50,
}
// Used for one-size products
```

### 7.5 Product List Filtering

```typescript
// Query parameters supported by GET /api/products
?category=oversized-tees    // Filter by category
&featured=true              // Only featured products
&inStock=true               // Only in-stock products

// Client-side filtering (products/page.tsx)
const filteredProducts = products
  .filter(p => p.name.toLowerCase().includes(searchTerm))
  .filter(p => filterCategory === 'all' || p.category === filterCategory)
  .filter(p => filterStatus === 'all' || 
    (filterStatus === 'instock' && hasStock(p)) ||
    (filterStatus === 'outofstock' && !hasStock(p))
  )
  .sort(sortFunction);
```

---

## 8. Order Management

### 8.1 Order Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER MANAGEMENT FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Orders Page (/orders)                                         │
│       │                                                         │
│       │ GET /api/orders                                         │
│       ▼                                                         │
│   ┌────────────────────────────────────────┐                    │
│   │           Orders Table                 │                    │
│   │  ┌──────┬────────┬────────┬──────────┐ │                    │
│   │  │ ID   │Customer│ Status │  Total   │ │                    │
│   │  ├──────┼────────┼────────┼──────────┤ │                    │
│   │  │SUTR..│ Rahul  │Pending │  ₹2,499  │ │ ◄──── Click Row    │
│   │  │SUTR..│ Priya  │Shipped │  ₹1,999  │ │                    │
│   │  └──────┴────────┴────────┴──────────┘ │                    │
│   └────────────────────────────────────────┘                    │
│                            │                                    │
│                            ▼                                    │
│                ┌─────────────────────────────┐                  │
│                │   OrderDetailsModal         │                  │
│                │                             │                  │
│                │  • Order Info               │                  │
│                │  • Customer Info            │                  │
│                │  • Shipping Address         │                  │
│                │  • Items List               │                  │
│                │  • Status Dropdown          │                  │
│                │  • Tracking Number Input    │                  │
│                │                             │                  │
│                │  [Save Changes]             │                  │
│                └─────────────────┬───────────┘                  │
│                                  │                              │
│                                  │ PUT /api/orders/[id]         │
│                                  ▼                              │
│                         Update Order in MongoDB                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Order Status Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                   ORDER STATUS LIFECYCLE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Customer places order on sutr.store                           │
│       │                                                        │
│       ▼                                                        │
│  ┌──────────┐                                                  │
│  │ PENDING  │ ◄──── Initial status                             │
│  └────┬─────┘                                                  │
│       │ Admin processes order                                  │
│       ▼                                                        │
│  ┌──────────────┐                                              │
│  │ PROCESSING   │                                              │
│  └──────┬───────┘                                              │
│         │ Admin ships order (adds tracking number)             │
│         ▼                                                      │
│  ┌──────────┐                                                  │
│  │ SHIPPED  │                                                  │
│  └────┬─────┘                                                  │
│       │ Ekart webhook or manual update                         │
│       ▼                                                        │
│  ┌──────────────────┐                                          │
│  │ OUT FOR DELIVERY │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────┐                                              │
│  │  DELIVERED   │ ◄──── Final success state                    │
│  └──────────────┘                                              │
│                                                                │
│  At any point (before delivery):                               │
│       │                                                        │
│       ▼                                                        │
│  ┌──────────────┐                                              │
│  │  CANCELLED   │ ◄──── Final cancelled state                  │
│  └──────────────┘                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.3 Order Status Badge Colors

```typescript
function getStatusBadgeColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'shipped':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'out for delivery':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
```

### 8.4 Order Details Modal

**File:** `components/OrderDetailsModal.tsx`

```typescript
// Modal sections
┌──────────────────────────────────────────────────────────────┐
│  Order Details                                         [X]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Order Information                                           │
│  ├── Order Number: SUTR_A7K9M2                               │
│  ├── Date: February 19, 2026                                 │
│  └── Status: [Dropdown ▼]                                    │
│                                                              │
│  Customer Information                                        │
│  ├── Name: Rahul Sharma                                      │
│  ├── Email: rahul@example.com                                │
│  └── Phone: +91 9876543210                                   │
│                                                              │
│  Shipping Address                                            │
│  ├── 123 MG Road                                             │
│  ├── Mumbai, Maharashtra                                     │
│  └── 400001                                                  │
│                                                              │
│  Items                                                       │
│  ├── [IMG] Oversized Tee - Black, L  x2     ₹1,998           │
│  └── [IMG] Hoodie - White, M         x1     ₹1,499           │
│                                                              │
│  ─────────────────────────────────────────────────           │
│  Subtotal:                                   ₹3,497          │
│  Shipping:                                     ₹99           │
│  Total:                                      ₹3,596          │
│                                                              │
│  Tracking                                                    │
│  └── Tracking Number: [________________]                     │
│                                                              │
│                              [Cancel]  [Save Changes]        │
└──────────────────────────────────────────────────────────────┘
```

### 8.5 Order Update API

**Endpoint:** `PUT /api/orders/[id]`

```typescript
// Request body
{
  status: 'shipped',                    // New status
  trackingNumber: '12345678901234',     // Optional tracking
}

// Server-side validation
if (!['pending', 'processing', 'shipped', 'out for delivery', 
      'delivered', 'cancelled'].includes(status)) {
  return error(400, 'Invalid status');
}

// Update order
await Order.findByIdAndUpdate(id, {
  status,
  trackingNumber,
  updatedAt: new Date(),
});
```

---

## 9. Customer Management

### 9.1 Customer List View

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMERS PAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customers                                    [Search...]       │
│  View and manage your customers                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Avatar │ Name      │ Email           │ Orders │ Actions  │   │
│  ├────────┼───────────┼─────────────────┼────────┼──────────┤   │
│  │  [👤]  │ Rahul S.  │ rahul@email.com │   5    │ [View]   │   │
│  │  [👤]  │ Priya M.  │ priya@email.com │   3    │ [View]   │   │
│  │  [👤]  │ Amit K.   │ amit@email.com  │   8    │ [View]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    View Order History (Modal)                   │
│                    ┌────────────────────────────┐               │
│                    │ Orders for Rahul S.        │               │
│                    ├────────────────────────────┤               │
│                    │ SUTR_A7K9 - ₹2,499 - Del.  │               │
│                    │ SUTR_B3M2 - ₹1,999 - Ship. │               │
│                    └────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Customer APIs

**Get All Customers**

```
GET /api/users

Response: {
  success: true,
  users: [
    {
      _id: string,
      firebaseUid: string,
      name: string,
      email: string,
      phone: string,
      avatar: string,
      createdAt: Date,
    }
  ]
}
```

**Get Customer Details**

```
GET /api/users/[id]

Response: {
  success: true,
  user: User,
  orderCount: number,
}
```

**Get Customer Orders**

```
GET /api/users/[id]/orders

Response: {
  success: true,
  orders: Order[],
}
```

---

## 10. Banner Management

### 10.1 Banner System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BANNER MANAGEMENT FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Products Page (/products)                                     │
│       │                                                         │
│       │ Click "Update Banner"                                   │
│       ▼                                                         │
│   ┌──────────────────────────────────────┐                      │
│   │       BannerUploadModal              │                      │
│   │                                      │                      │
│   │  ┌────────────────────────────────┐  │                      │
│   │  │     Mobile Banners (5 max)     │  │                      │
│   │  │  [Drag & Drop Zone]            │  │                      │
│   │  │  [IMG1] [IMG2] [IMG3]          │  │                      │
│   │  └────────────────────────────────┘  │                      │
│   │                                      │                      │
│   │  ┌────────────────────────────────┐  │                      │
│   │  │    Desktop Banners (5 max)     │  │                      │
│   │  │  [Drag & Drop Zone]            │  │                      │
│   │  │  [IMG1] [IMG2] [IMG3]          │  │                      │
│   │  └────────────────────────────────┘  │                      │
│   │                                      │                      │
│   │           [Cancel] [Save]            │                      │
│   └──────────────────────────────────────┘                      │
│                    │                                            │
│                    │ Upload to Cloudinary                       │
│                    │ POST /api/upload                           │
│                    │                                            │
│                    │ Save banner URLs                           │
│                    │ POST /api/banners                          │
│                    ▼                                            │
│            MongoDB Banner Document                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Banner Data Structure

```typescript
// MongoDB Banner document
{
  _id: ObjectId,
  mobileBanners: [
    {
      url: 'https://res.cloudinary.com/.../mobile1.jpg',
      alt: 'Summer Collection',
      link: '/shop?category=summer',
      order: 0,
    },
    // ... up to 5 banners
  ],
  desktopBanners: [
    {
      url: 'https://res.cloudinary.com/.../desktop1.jpg',
      alt: 'Summer Collection',
      link: '/shop?category=summer',
      order: 0,
    },
    // ... up to 5 banners
  ],
  createdAt: Date,
  updatedAt: Date,
}
```

### 10.3 Banner Upload Modal

**File:** `components/BannerUploadModal.tsx`

Features:

- Separate sections for mobile and desktop banners
- Drag-and-drop image upload
- Preview of uploaded images
- Reorder functionality
- Delete individual banners
- Max 5 banners per type

---

## 11. Reports & Statistics

### 11.1 Reports Page

**Endpoint:** `GET /api/reports`

```typescript
// Response structure
{
  success: true,
  reports: {
    // Sales by period
    dailySales: [
      { date: '2026-02-19', total: 15000, orders: 8 },
      { date: '2026-02-18', total: 12500, orders: 6 },
      // ... last 30 days
    ],
    
    // Sales by category
    categoryBreakdown: [
      { category: 'oversized-tees', total: 45000, count: 25 },
      { category: 'hoodies', total: 38000, count: 15 },
    ],
    
    // Top products
    topProducts: [
      { name: 'Heritage Hoodie', sold: 45, revenue: 89550 },
      { name: 'Classic Tee', sold: 38, revenue: 75962 },
    ],
  }
}
```

### 11.2 Statistics Page

**Endpoint:** `GET /api/statistics`

```typescript
// Response structure for charts
{
  success: true,
  statistics: {
    // Monthly revenue chart
    monthlyRevenue: [
      { month: 'Jan', revenue: 125000 },
      { month: 'Feb', revenue: 148000 },
      // ... 12 months
    ],
    
    // Order status distribution (pie chart)
    orderStatus: [
      { status: 'delivered', count: 250 },
      { status: 'shipped', count: 45 },
      { status: 'pending', count: 12 },
    ],
    
    // Customer growth (line chart)
    customerGrowth: [
      { month: 'Jan', customers: 50 },
      { month: 'Feb', customers: 78 },
    ],
  }
}
```

### 11.3 Chart Components (Recharts)

```typescript
// Example: Revenue Line Chart
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={monthlyRevenue}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="revenue" stroke="#000" />
  </LineChart>
</ResponsiveContainer>

// Example: Status Pie Chart
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={orderStatus}
      dataKey="count"
      nameKey="status"
      cx="50%"
      cy="50%"
      fill="#000"
    />
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

---

## 12. Database Models

### 12.1 Product Model

**File:** `lib/models/Product.ts`

```typescript
const ProductSchema = new Schema({
  // Basic Info
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  
  // Pricing
  price: { type: Number, required: true },
  salePrice: { type: Number },
  
  // Categorization
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  tags: [{ type: String }],
  
  // Images (Cloudinary URLs)
  images: [{ type: String }],
  
  // Variants
  sizes: [{ type: String }],
  colors: [{ type: String }],
  
  // Stock Management
  inStock: { type: Schema.Types.Mixed },   // boolean or boolean[]
  stock: { type: Schema.Types.Mixed },     // number or number[]
  
  // Display Flags
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  
  // Product Details (specs)
  productDetails: { type: Object },
  
}, { timestamps: true });

// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ newArrival: 1 });
```

### 12.2 Order Model

**File:** `lib/models/Order.ts`

```typescript
const OrderSchema = new Schema({
  // Brand-friendly ID
  orderNumber: { type: String, required: true, unique: true },
  
  // Link to customer (Firebase UID, not MongoDB _id)
  userId: { type: String, required: true, index: true },
  
  // Order Items
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String },
    color: { type: String },
  }],
  
  // Pricing
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'out for delivery', 
           'delivered', 'cancelled'],
    default: 'pending',
  },
  
  // Shipping
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
  },
  trackingNumber: { type: String },
  
  // Payment
  paymentMethod: { type: String, default: 'razorpay' },
  paymentStatus: { type: String, default: 'paid' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  
}, { timestamps: true });

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
```

### 12.3 User Model

**File:** `lib/models/User.ts`

```typescript
const UserSchema = new Schema({
  // Firebase UID (primary identifier)
  firebaseUid: { type: String, required: true, unique: true },
  
  // Profile
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  
  // Addresses
  addresses: [{
    _id: { type: Schema.Types.ObjectId, auto: true },
    isDefault: { type: Boolean, default: false },
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    label: String,  // 'home', 'work', 'other'
  }],
  
  // Shopping
  cart: [{
    productId: String,
    quantity: Number,
    selectedSize: String,
    selectedColor: String,
    addedAt: Date,
  }],
  
  wishlist: [{ type: String }],  // Product IDs
  
}, { timestamps: true });

// Indexes
UserSchema.index({ firebaseUid: 1 }, { unique: true });
UserSchema.index({ email: 1 });
```

### 12.4 Banner Model

**File:** `lib/models/Banner.ts`

```typescript
const BannerItemSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String },
  link: { type: String },
  order: { type: Number, default: 0 },
});

const BannerSchema = new Schema({
  mobileBanners: [BannerItemSchema],
  desktopBanners: [BannerItemSchema],
}, { timestamps: true });
```

### 12.5 SiteSettings Model

**File:** `lib/models/SiteSettings.ts`

```typescript
const SiteSettingsSchema = new Schema({
  maintenance: { type: Boolean, default: false },
}, { timestamps: true });

// Singleton pattern - only one document
SiteSettingsSchema.pre('save', async function(next) {
  const count = await this.constructor.countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one SiteSettings document allowed');
  }
  next();
});
```

---

## 13. API Reference

### 13.0 API Endpoints Summary Table

| Method | Endpoint | Auth | Description | Request Body | Response |
|--------|----------|------|-------------|--------------|----------|
| **Dashboard** |||||
| `GET` | `/api/dashboard/stats` | ✓ Admin | Get dashboard analytics | - | `{ stats, recentOrders, pendingOrdersCount, topProduct, statusBreakdown }` |
| **Products** |||||
| `GET` | `/api/products` | ✓ Admin | List all products | - | `{ products[], count }` |
| `GET` | `/api/products?category=X` | ✓ Admin | Filter by category | - | `{ products[], count }` |
| `GET` | `/api/products?featured=true` | ✓ Admin | Filter featured only | - | `{ products[], count }` |
| `GET` | `/api/products?inStock=true` | ✓ Admin | Filter in-stock only | - | `{ products[], count }` |
| `POST` | `/api/products` | ✓ Admin | Create new product | `{ name, description, price, category, subcategory, images[], sizes[]?, stock[]?, featured?, newArrival? }` | `{ product }` |
| `GET` | `/api/products/[id]` | ✓ Admin | Get single product | - | `{ product }` |
| `PUT` | `/api/products/[id]` | ✓ Admin | Update product | `{ ...updates }` | `{ product }` |
| `DELETE` | `/api/products/[id]` | ✓ Admin | Delete product | - | `{ message }` |
| **Orders** |||||
| `GET` | `/api/orders` | ✓ Admin | List all orders | - | `{ orders[], total }` |
| `GET` | `/api/orders?status=X` | ✓ Admin | Filter by status | - | `{ orders[], total }` |
| `GET` | `/api/orders?limit=X&skip=Y` | ✓ Admin | Paginated orders | - | `{ orders[], total, limit, skip }` |
| `GET` | `/api/orders/[id]` | ✓ Admin | Get single order | - | `{ order }` |
| `PUT` | `/api/orders/[id]` | ✓ Admin | Update order status | `{ status, trackingNumber? }` | `{ order }` |
| **Users/Customers** |||||
| `GET` | `/api/users` | ✓ Admin | List all customers | - | `{ users[] }` |
| `GET` | `/api/users/[id]` | ✓ Admin | Get customer details | - | `{ user, orderCount }` |
| `DELETE` | `/api/users/[id]` | ✓ Admin | Delete customer | - | `{ message }` |
| `GET` | `/api/users/[id]/orders` | ✓ Admin | Get customer's orders | - | `{ orders[] }` |
| **Banners** |||||
| `GET` | `/api/banners` | ✓ Admin | Get all banners | - | `{ mobileBanners[], desktopBanners[] }` |
| `POST` | `/api/banners` | ✓ Admin | Update banners | `{ mobileBanners[], desktopBanners[] }` | `{ banners }` |
| `GET` | `/api/banners/[id]` | ✓ Admin | Get single banner | - | `{ banner }` |
| `PUT` | `/api/banners/[id]` | ✓ Admin | Update single banner | `{ url, alt?, link? }` | `{ banner }` |
| `DELETE` | `/api/banners/[id]` | ✓ Admin | Delete banner | - | `{ message }` |
| **Upload** |||||
| `POST` | `/api/upload` | ✓ Admin | Upload image to Cloudinary | `FormData { file }` | `{ url, publicId }` |
| **Profile** |||||
| `GET` | `/api/profile` | ✓ Admin | Get admin profile | - | `{ profile }` |
| `PUT` | `/api/profile` | ✓ Admin | Update admin profile | `{ name?, avatar? }` | `{ profile }` |
| **Categories** |||||
| `GET` | `/api/categories` | ✓ Admin | Get distinct categories | - | `{ categories[] }` |
| **Reports** |||||
| `GET` | `/api/reports` | ✓ Admin | Get sales reports | - | `{ dailySales[], categoryBreakdown[], topProducts[] }` |
| **Statistics** |||||
| `GET` | `/api/statistics` | ✓ Admin | Get chart data | - | `{ monthlyRevenue[], orderStatus[], customerGrowth[] }` |
| **Site Settings** |||||
| `GET` | `/api/site-settings` | ✓ Admin | Get site settings | - | `{ maintenance }` |
| `PUT` | `/api/site-settings` | ✓ Admin | Update settings | `{ maintenance }` | `{ settings }` |

### 13.1 Authentication Headers

All protected routes require:

```
Authorization: Bearer <firebase_id_token>
```

### 13.2 Dashboard API

#### Get Dashboard Stats

```
GET /api/dashboard/stats
Authorization: Bearer <token>

Response: {
  success: true,
  stats: { totalSales, totalOrders, totalCustomers, totalProducts, ...growth },
  recentOrders: Order[],
  pendingOrdersCount: number,
  topProduct: { name, count },
  statusBreakdown: { pending, processing, shipped, ... }
}
```

### 13.3 Products API

#### List Products

```
GET /api/products
?category=<string>
&featured=<boolean>
&inStock=<boolean>

Response: {
  success: true,
  products: Product[],
  count: number
}
```

#### Get Product

```
GET /api/products/[id]

Response: {
  success: true,
  product: Product
}
```

#### Create Product

```
POST /api/products
Body: {
  name, description, price, category, subcategory,
  images, sizes?, colors?, stock?, featured?, newArrival?
}

Response: {
  success: true,
  product: Product
}
```

#### Update Product

```
PUT /api/products/[id]
Body: { ...updates }

Response: {
  success: true,
  product: Product
}
```

#### Delete Product

```
DELETE /api/products/[id]

Response: {
  success: true,
  message: 'Product deleted'
}
```

### 13.4 Orders API

#### List Orders

```
GET /api/orders
?status=<string>
&limit=<number>
&skip=<number>

Response: {
  success: true,
  orders: Order[],
  total: number
}
```

#### Get Order

```
GET /api/orders/[id]

Response: {
  success: true,
  order: Order
}
```

#### Update Order

```
PUT /api/orders/[id]
Body: {
  status: string,
  trackingNumber?: string
}

Response: {
  success: true,
  order: Order
}
```

### 13.5 Users API

#### List Users

```
GET /api/users

Response: {
  success: true,
  users: User[]
}
```

#### Get User

```
GET /api/users/[id]

Response: {
  success: true,
  user: User,
  orderCount: number
}
```

#### Get User Orders

```
GET /api/users/[id]/orders

Response: {
  success: true,
  orders: Order[]
}
```

#### Delete User

```
DELETE /api/users/[id]

Response: {
  success: true,
  message: 'User deleted'
}
```

### 13.6 Banners API

#### Get Banners

```
GET /api/banners

Response: {
  success: true,
  banners: {
    mobileBanners: BannerItem[],
    desktopBanners: BannerItem[]
  }
}
```

#### Update Banners

```
POST /api/banners
Body: {
  mobileBanners: BannerItem[],
  desktopBanners: BannerItem[]
}

Response: {
  success: true,
  banners: Banner
}
```

### 13.7 Upload API

#### Upload Image

```
POST /api/upload
Content-Type: multipart/form-data
Body: { file: File }

Response: {
  success: true,
  url: string,           // Cloudinary URL
  publicId: string       // Cloudinary public ID
}
```

### 13.8 Profile API

#### Get Admin Profile

```
GET /api/profile

Response: {
  success: true,
  profile: {
    name: string,
    email: string,
    avatar?: string
  }
}
```

#### Update Admin Profile

```
PUT /api/profile
Body: {
  name?: string,
  avatar?: string
}

Response: {
  success: true,
  profile: {...}
}
```

### 13.9 Categories API

#### Get Categories

```
GET /api/categories

Response: {
  success: true,
  categories: string[]   // Distinct category values
}
```

### 13.10 Site Settings API

#### Get Settings

```
GET /api/site-settings

Response: {
  success: true,
  settings: {
    maintenance: boolean
  }
}
```

#### Update Settings

```
PUT /api/site-settings
Body: {
  maintenance: boolean
}

Response: {
  success: true,
  settings: {...}
}
```

---

## 14. Security Implementation

### 14.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| **Admin-Only Access** | Firebase custom claims (`admin: true`) |
| **Token Verification** | Server-side via Firebase Admin SDK |
| **Route Protection** | AuthGuard component + API middleware |
| **Session Timeout** | Auto-logout after 1 hour inactivity |

### 14.2 API Route Protection Pattern

```typescript
// Every protected API route follows this pattern
export async function GET(request: NextRequest) {
  // 1. Verify admin auth
  const isAdmin = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Process request
  // ...
}
```

### 14.3 Token Verification Flow

```
Client Request
    │
    │ Authorization: Bearer <token>
    ▼
API Route
    │
    │ verifyAdminAuth(request)
    ▼
Firebase Admin SDK
    │
    │ adminAuth.verifyIdToken(token)
    ▼
Check Claims
    │
    │ decodedToken.admin === true?
    ▼
┌───────────────────┐
│ Yes: Process      │
│ No: 401/403 Error │
└───────────────────┘
```

### 14.4 Input Validation

```typescript
// Product creation validation example
function validateProductInput(body: any): { valid: boolean; error?: string } {
  if (!body.name || body.name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }
  if (!body.price || body.price <= 0) {
    return { valid: false, error: 'Price must be greater than 0' };
  }
  if (body.salePrice && body.salePrice >= body.price) {
    return { valid: false, error: 'Sale price must be less than regular price' };
  }
  // ... more validations
  return { valid: true };
}
```

---

## 15. Session Management

### 15.1 Session Timeout System

**File:** `lib/use-session-timeout.ts`

```typescript
// Configuration
const SESSION_TIMEOUT = 60 * 60 * 1000;       // 60 minutes
const WARNING_BEFORE = 5 * 60 * 1000;         // 5 minutes warning

// Hook returns
interface SessionTimeout {
  showWarning: boolean;         // Show countdown modal
  timeRemaining: number;        // Seconds until logout
  extendSession: () => void;    // Reset timer
  logout: () => Promise<void>;  // Immediate logout
}
```

### 15.2 Session Timeout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   SESSION TIMEOUT FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User Activity (click, keypress, scroll)                       │
│       │                                                         │
│       │ Reset lastActivity timestamp                            │
│       ▼                                                         │
│   ┌──────────────────────────────┐                              │
│   │  Timer: Check every 10 sec   │                              │
│   └──────────────────────────────┘                              │
│       │                                                         │
│       │ Calculate: now - lastActivity                           │
│       ▼                                                         │
│   ┌─────────────────────────────────────────────┐               │
│   │ < 55 min?  ──────►  Normal Operation        │               │
│   │                                             │               │
│   │ 55-60 min? ──────►  Show Warning Modal      │               │
│   │                     [Countdown: 5:00]       │               │
│   │                     [Stay Logged In]        │               │
│   │                     [Logout Now]            │               │
│   │                                             │               │
│   │ > 60 min?  ──────►  Force Logout            │               │
│   │                     Redirect to /login      │               │
│   └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.3 Activity Events Tracked

```typescript
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove', 
  'keydown',
  'scroll',
  'touchstart',
  'click',
];
```

---

## 16. Image Upload System

### 16.1 Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE UPLOAD FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User Action                                                   │
│       │                                                         │
│       │ Select/Drop image files                                 │
│       ▼                                                         │
│   ┌──────────────────────────────────┐                          │
│   │     ImageUpload Component        │                          │
│   │  • Validate file type (jpg/png)  │                          │
│   │  • Validate file size (<5MB)     │                          │
│   │  • Show preview                  │                          │
│   └──────────────────────────────────┘                          │
│       │                                                         │
│       │ uploadImages(files)                                     │
│       ▼                                                         │
│   ┌──────────────────────────────────┐                          │
│   │     lib/upload-images.ts         │                          │
│   │  Creates FormData                │                          │
│   │  POST /api/upload                │                          │
│   └──────────────────────────────────┘                          │
│       │                                                         │
│       ▼                                                         │
│   ┌──────────────────────────────────┐                          │
│   │     /api/upload/route.ts         │                          │
│   │  • Verify admin auth             │                          │
│   │  • Upload to Cloudinary          │                          │
│   │  • Return URL + publicId         │                          │
│   └──────────────────────────────────┘                          │
│       │                                                         │
│       ▼                                                         │
│   ┌──────────────────────────────────┐                          │
│   │     Cloudinary                   │                          │
│   │  • Store image                   │                          │
│   │  • Auto-optimize                 │                          │
│   │  • CDN delivery                  │                          │
│   └──────────────────────────────────┘                          │
│       │                                                         │
│       │ Returns: https://res.cloudinary.com/...                 │
│       ▼                                                         │
│   Image URL stored in Product/Banner document                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 16.2 Upload Helper

**File:** `lib/upload-images.ts`

```typescript
export async function uploadImages(
  files: File[], 
  token: string
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    return data.url;
  });
  
  return Promise.all(uploadPromises);
}
```

### 16.3 Cloudinary Configuration

```typescript
// Upload options used
{
  folder: 'sutr-products',      // Or 'sutr-banners'
  transformation: [
    { quality: 'auto' },
    { fetch_format: 'auto' },
  ],
  resource_type: 'image',
}
```

---

## 17. Environment Configuration

### 17.1 Required Environment Variables

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# MongoDB
MONGODB_URI=mongodb+srv://...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 17.2 Environment File Structure

```
sutr.store-admin/
├── .env.local           # Local development (not committed)
├── .env.example         # Template for required variables
└── .env.production      # Production overrides (if needed)
```

---

## 18. Deployment Considerations

### 18.1 Build Configuration

**File:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // External image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### 18.2 Recommended Platform

**Vercel** (native Next.js support)

```
Features Used:
├── Serverless Functions (API routes)
├── Edge Runtime (optional middleware)
├── Image Optimization
├── Environment Variables
└── Preview Deployments
```

### 18.3 Security Recommendations

| Area | Recommendation |
|------|----------------|
| **Environment Variables** | Use Vercel's encrypted env vars |
| **Firebase Private Key** | Store securely, never commit |
| **MongoDB Access** | IP whitelist or use Atlas security |
| **Admin Access** | Limit admin accounts, audit regularly |

### 18.4 Performance Optimizations

| Area | Implementation |
|------|----------------|
| **API Caching** | Cache dashboard stats (5 min TTL) |
| **Image Optimization** | Cloudinary auto-format + Next.js Image |
| **MongoDB** | Connection pooling via cached connection |
| **Bundle Size** | Tree shaking, dynamic imports |

---

## Appendix A: Admin Navigation Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Analytics overview |
| `/products` | Product List | Manage products |
| `/products/new` | New Product | Create product |
| `/products/[id]/edit` | Edit Product | Update product |
| `/orders` | Order List | Manage orders |
| `/customers` | Customer List | View customers |
| `/reports` | Reports | Sales reports |
| `/statistics` | Statistics | Visual analytics |
| `/profile` | Profile | Admin settings |
| `/login` | Login | Admin authentication |
| `/unauthorized` | Unauthorized | Access denied page |

---

## Appendix B: API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/dashboard/stats` | Dashboard analytics |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/[id]` | Get product |
| PUT | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Delete product |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/[id]` | Get order |
| PUT | `/api/orders/[id]` | Update order |
| GET | `/api/users` | List customers |
| GET | `/api/users/[id]` | Get customer |
| DELETE | `/api/users/[id]` | Delete customer |
| GET | `/api/users/[id]/orders` | Customer orders |
| GET | `/api/banners` | Get banners |
| POST | `/api/banners` | Update banners |
| POST | `/api/upload` | Upload image |
| GET | `/api/profile` | Get admin profile |
| PUT | `/api/profile` | Update admin profile |
| GET | `/api/categories` | Get categories |
| GET | `/api/reports` | Sales reports |
| GET | `/api/statistics` | Chart data |
| GET | `/api/site-settings` | Get settings |
| PUT | `/api/site-settings` | Update settings |

---

## Appendix C: File Quick Reference

| Need To... | File Location |
|------------|---------------|
| Add API endpoint | `app/api/<endpoint>/route.ts` |
| Create new page | `app/<route>/page.tsx` |
| Add component | `components/<Name>.tsx` |
| Modify auth flow | `lib/auth-context.tsx` |
| Update admin verification | `lib/auth-admin.ts` |
| Change database schema | `lib/models/<Model>.ts` |
| Add environment var | `.env.local` |
| Configure Next.js | `next.config.ts` |
| Modify styling | `app/globals.css` |

---

## Appendix D: Shared Resources with Main Platform

Both `sutr.store` and `sutr.store-admin` share:

| Resource | Notes |
|----------|-------|
| **MongoDB Atlas** | Same database, same collections |
| **Firebase Auth** | Same project, admins have custom claims |
| **Cloudinary** | Same account for product/banner images |
| **Data Models** | Same schema structures |

**Important:** Changes to database documents via admin panel immediately reflect on the main customer-facing site.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.5.0 | Feb 19, 2026 | [Itesh Tomar](https://github.com/iteshxt) | Initial comprehensive documentation |

---

*This document was created based on codebase analysis. For the most up-to-date information, always refer to the source code.*