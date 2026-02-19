# Sutr Clothing - Technical Architecture Guide

> **Version:** 1.6.2  
> **Last Updated:** February 11, 2026  
> **Author:** [Itesh Tomar](https://github.com/iteshxt)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Stack](#2-technical-stack)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Directory Structure](#4-directory-structure)
5. [Authentication System](#5-authentication-system)
6. [State Management](#6-state-management)
7. [Product System](#7-product-system)
8. [Cart & Wishlist](#8-cart--wishlist)
9. [Checkout & Payment Flow](#9-checkout--payment-flow)
10. [Shipping Integration](#10-shipping-integration)
11. [Database Models](#11-database-models)
12. [API Reference](#12-api-reference)
13. [Caching Strategies](#13-caching-strategies)
14. [SEO & PWA Configuration](#14-seo--pwa-configuration)
15. [Security Implementation](#15-security-implementation)
16. [Error Handling](#16-error-handling)
17. [Environment Configuration](#17-environment-configuration)
18. [Deployment Considerations](#18-deployment-considerations)

---

## 1. Project Overview

### 1.1 Business Description

**Sutr Clothing** is a modern e-commerce platform specializing in premium streetwear inspired by Indian culture. The platform offers oversized tees, hoodies, and sustainable fashion that celebrates heritage with a contemporary twist.

### 1.2 Core Features

| Feature | Description |
|---------|-------------|
| **Product Catalog** | Filterable shop with categories, sizes, colors, and search |
| **User Accounts** | Registration, login, profile management, address book |
| **Shopping Cart** | Persistent cart with size/color variants |
| **Wishlist** | Save products for later with move-to-cart functionality |
| **Secure Checkout** | Razorpay payment integration |
| **Order Management** | Order history, tracking, status updates |
| **Shipping** | Ekart Logistics integration with real-time tracking |

### 1.3 Target Audience

- Fashion-conscious Indian consumers
- Streetwear enthusiasts
- Customers seeking sustainable clothing options

---

## 2. Technical Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | React framework with App Router |
| **React** | 19.x | UI library with Server Components |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |

### 2.2 Backend

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **Firebase Admin** | Server-side auth verification |

### 2.3 External Services

| Service | Purpose |
|---------|---------|
| **Firebase Auth** | User authentication (Email/Password, Google OAuth) |
| **MongoDB Atlas** | Cloud database hosting |
| **Razorpay** | Payment gateway (INR transactions) |
| **Ekart Logistics** | Shipping and delivery |
| **Cloudinary** | Image hosting and optimization |

### 2.4 Development Tools

```
├── ESLint          → Code linting
├── TypeScript      → Static type checking
├── Turbopack       → Fast development bundler
└── PostCSS         → CSS processing
```

---

## 3. Architecture Patterns

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ AuthContext │  │ CartContext │  │WishlistCtx  │  React       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  Context     │
│         │                │                │                     │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              localStorage Cache               │  Local-First │
│  │         (userCache, productCache)             │  Caching     │
│  └──────────────────────┬────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────┘
                          │ Debounced Sync (500ms)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes (/api)                    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  /shop      │ /cart     │ /orders   │ /payments         │    │
│  │  /wishlist  │ /users    │ /shipping │ /site-settings    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐    │
│  │              Server-Side Services                       │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  Firebase Admin │ Mongoose Models │ Server Cache        │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐          ┌──────────┐         ┌──────────┐
    │ MongoDB  │         │ Firebase │         │ External │
    │  Atlas   │         │   Auth   │         │   APIs   │
    └──────────┘         └──────────┘         └──────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                         ┌──────────┐     ┌──────────┐      ┌──────────┐
                         │ Razorpay │     │  Ekart   │      │Cloudinary│
                         └──────────┘     └──────────┘      └──────────┘
```

### 3.2 Local-First Data Strategy

The application implements a **local-first** architecture for optimal performance:

```
User Action → Local Update → UI Renders → Background Sync → Server Update
                  ↓
            Immediate UX
```

**Key Benefits:**

- Instant UI feedback (no loading states for cart/wishlist operations)
- Offline resilience (data persists in localStorage)
- Reduced server load (batched/debounced sync)
- Graceful degradation on network failures

### 3.3 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Server Components                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ • Page layouts          • Static content                ││
│  │ • Data fetching         • SEO metadata                  ││
│  │ • Server-side rendering • Route handlers                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ "use client"
┌─────────────────────────────────────────────────────────────┐
│                    Client Components                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ • Interactive UI        • Form handling                 ││
│  │ • Context consumers     • Browser APIs                  ││
│  │ • Event handlers        • Real-time updates             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
sutr.store/
├── app/                          # Next.js App Router
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with providers
│   ├── loading.tsx               # Global loading UI
│   ├── page.tsx                  # Homepage
│   ├── not-found.tsx             # 404 page
│   ├── metadata.ts               # Default SEO metadata
│   ├── robots.ts                 # Robots.txt generator
│   ├── sitemap.ts                # Dynamic sitemap
│   ├── manifest.webmanifest      # PWA manifest
│   ├── resource-hints.tsx        # Preconnect/prefetch hints
│   │
│   ├── about/                    # About page
│   ├── account/                  # User account section
│   │   ├── layout.tsx            # Account sidebar layout
│   │   ├── page.tsx              # Account dashboard
│   │   ├── login/                # Login page
│   │   ├── signup/               # Registration page
│   │   ├── profile/              # Profile management
│   │   ├── addresses/            # Address book
│   │   ├── orders/               # Order history
│   │   └── wishlist/             # Saved items
│   │
│   ├── api/                      # API routes
│   │   ├── banners/              # Homepage banners
│   │   ├── cart/                 # Cart operations
│   │   ├── orders/               # Order management
│   │   ├── payments/             # Razorpay integration
│   │   │   ├── create-order/     # Create payment order
│   │   │   └── verify/           # Verify payment signature
│   │   ├── shipping/             # Ekart integration
│   │   │   ├── create/           # Create shipment
│   │   │   ├── serviceability/   # Check delivery availability
│   │   │   └── webhook/          # Status updates
│   │   ├── shop/                 # Product API
│   │   │   ├── route.ts          # List/filter products
│   │   │   ├── [slug]/           # Single product
│   │   │   └── featured/         # Featured products
│   │   ├── site-settings/        # Maintenance mode
│   │   ├── user/sync/            # User data sync
│   │   ├── users/                # User CRUD
│   │   └── wishlist/             # Wishlist operations
│   │
│   ├── auth/action/              # Firebase auth actions
│   ├── cart/                     # Cart page
│   ├── checkout/                 # Checkout flow
│   ├── maintenance/              # Maintenance mode page
│   ├── order/success/            # Order confirmation
│   ├── privacy-policy/           # Privacy policy
│   ├── return-refund/            # Return policy
│   ├── shop/                     # Product catalog
│   │   ├── page.tsx              # Shop listing
│   │   └── [slug]/               # Product detail
│   └── terms-of-service/         # Terms page
│
├── components/                   # Reusable components
│   ├── auth/                     # Auth-related components
│   │   └── GoogleSignIn.tsx      # Google OAuth button
│   ├── Button.tsx                # Button component
│   ├── Footer.tsx                # Site footer
│   ├── Header.tsx                # Site header/nav
│   ├── HamburgerMenu.tsx         # Mobile navigation
│   ├── HeroCarousel.tsx          # Homepage carousel
│   ├── Loading.tsx               # Loading spinners
│   ├── Logo.tsx                  # Brand logo
│   ├── Notification.tsx          # Toast notifications
│   └── ProductCard.tsx           # Product grid card
│
├── lib/                          # Shared utilities
│   ├── auth-context.tsx          # Auth state provider
│   ├── cart-context.tsx          # Cart state provider
│   ├── wishlist-context.tsx      # Wishlist state provider
│   ├── user-cache.ts             # User data local cache
│   ├── use-user-cache.ts         # User cache React hook
│   ├── product-cache.ts          # Product data cache
│   ├── use-products.ts           # Product fetching hooks
│   ├── server-cache.ts           # Server-side cache
│   ├── firebase.ts               # Firebase client SDK
│   ├── firebase-admin.ts         # Firebase Admin SDK
│   ├── mongodb.ts                # MongoDB connection
│   ├── cloudinary.ts             # Cloudinary config
│   ├── ekart-auth.ts             # Ekart OAuth tokens
│   ├── maintenance.ts            # Maintenance mode check
│   ├── logger.ts                 # Dev-only logging
│   ├── utils.ts                  # Helper functions
│   ├── models/                   # Mongoose schemas
│   │   ├── Banner.ts
│   │   ├── Order.ts
│   │   ├── Product.ts
│   │   ├── SiteSettings.ts
│   │   └── User.ts
│   └── services/                 # Business logic
│       ├── email.ts              # Email service
│       ├── products.ts           # Product operations
│       ├── users.ts              # User operations
│       └── index.ts              # Service exports
│
├── constants/                    # App constants
│   ├── index.ts                  # General constants
│   └── avatars.ts                # Avatar options
│
├── types/                        # TypeScript definitions
│   └── index.d.ts                # Global types
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── fonts/                    # Custom fonts
│   └── images/                   # Static images
│       ├── avatars/
│       ├── logo/
│       └── products/
│
├── styles/                       # Additional styles
│   └── globals.css
│
└── Configuration Files
    ├── next.config.ts            # Next.js configuration
    ├── tailwind.config.js        # Tailwind theme
    ├── tsconfig.json             # TypeScript config
    ├── eslint.config.mjs         # ESLint rules
    ├── postcss.config.mjs        # PostCSS plugins
    ├── middleware.ts             # Edge middleware
    ├── package.json              # Dependencies
    └── spec.yaml                 # Ekart API docs
```

---

## 5. Authentication System

### 5.1 Authentication Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │  User Login  │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                      │
│   │        Firebase Authentication        │                     │
│   │  ┌────────────┐  ┌─────────────────┐ │                      │
│   │  │   Email/   │  │  Google OAuth   │ │                      │
│   │  │  Password  │  │                 │ │                      │
│   │  └─────┬──────┘  └────────┬────────┘ │                      │
│   └────────┼──────────────────┼──────────┘                      │
│            │                  │                                 │
│            └────────┬─────────┘                                 │
│                     │                                           │
│                     ▼                                           │
│          ┌──────────────────┐                                   │
│          │  Firebase Token  │ (ID Token + Refresh Token)        │
│          └────────┬─────────┘                                   │
│                   │                                             │
│          ┌────────┴────────┐                                    │
│          │                 │                                    │
│          ▼                 ▼                                    │
│   ┌──────────────┐  ┌──────────────┐                            │
│   │   Client     │  │   Server     │                            │
│   │  onAuthState │  │  API Routes  │                            │
│   │   Change     │  │  Verify JWT  │                            │
│   └──────┬───────┘  └──────┬───────┘                            │
│          │                 │                                    │
│          ▼                 ▼                                    │
│   ┌──────────────────────────────────────┐                      │
│   │         MongoDB User Document        │                      │
│   │  ┌────────────────────────────────┐  │                      │
│   │  │ firebaseUid, email, name,      │  │                      │
│   │  │ cart[], wishlist[], addresses[]│  │                      │
│   │  └────────────────────────────────┘  │                      │
│   └──────────────────────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Firebase Client Setup

**File:** `lib/firebase.ts`

```typescript
// Firebase Client SDK Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

// Auth instance with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
```

### 5.3 Firebase Admin Setup

**File:** `lib/firebase-admin.ts`

```typescript
// Server-side token verification
export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken;
}
```

### 5.4 Auth Context Provider

**File:** `lib/auth-context.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  mongoUser: MongoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<MongoUser>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshMongoUser: () => Promise<void>;
}
```

### 5.5 Authentication Methods

#### Email/Password Sign In

```
1. User enters credentials
2. Firebase validates credentials
3. On success: Firebase returns user + token
4. AuthContext fetches/creates MongoDB user
5. User data loaded into local cache
6. Cart/Wishlist contexts subscribe to cache updates
```

#### Google OAuth Sign In

```
1. User clicks "Sign in with Google"
2. Firebase opens OAuth popup
3. User authenticates with Google
4. Firebase returns user + token
5. Check if user exists in MongoDB
6. If new: Create user with Google profile data
7. Load user data into local cache
```

#### Sign Up Flow

```
1. User fills registration form (name, email, password)
2. Firebase creates auth account
3. API creates MongoDB user document
4. Auto sign-in after registration
5. Redirect to account page
```

### 5.6 Protected Routes

Protected routes check authentication in the page component:

```typescript
// Example: Account page protection
const AccountPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/account/login?redirect=/account');
    }
  }, [user, loading, router]);

  if (loading) return <Loading />;
  if (!user) return null;

  return <AccountContent />;
};
```

### 5.7 API Route Protection

```typescript
// Bearer token verification pattern
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    // ... proceed with authenticated request
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

---

## 6. State Management

### 6.1 Context Providers Hierarchy

```typescript
// app/layout.tsx
<AuthProvider>
  <CartProvider>
    <WishlistProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </WishlistProvider>
  </CartProvider>
</AuthProvider>
```

### 6.2 User Cache System

**File:** `lib/user-cache.ts`

The user cache is the central hub for local-first data management:

```typescript
interface CachedUser {
  data: MongoUser;
  timestamp: number;
  dirty: boolean;        // Has unsaved local changes
  syncInProgress: boolean;
}

class UserCache {
  private static CACHE_KEY = 'sutr_user_cache';
  private static CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static SYNC_DEBOUNCE = 500; // ms

  // Core operations
  getUser(): MongoUser | null;
  setUser(user: MongoUser, markDirty?: boolean): void;
  clearUser(): void;

  // Cart operations
  getCart(): CartItem[];
  updateCart(cart: CartItem[]): void;

  // Wishlist operations
  getWishlist(): string[];
  updateWishlist(wishlist: string[]): void;

  // Sync operations
  registerSyncCallback(callback: () => Promise<void>): void;
  forceSyncNow(): Promise<void>;
  scheduleSync(): void;
}
```

### 6.3 Debounced Synchronization

```
┌────────────────────────────────────────────────────────────┐
│                  SYNC FLOW TIMELINE                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  T+0ms      T+100ms    T+300ms    T+500ms    T+800ms       │
│    │           │          │          │          │          │
│    ▼           ▼          ▼          ▼          ▼          │
│  Action1   Action2    Action3    Debounce   API Call       │
│  (add)     (update)   (remove)   Timer      Executes       │
│                                  Fires                     │
│    │           │          │                    │           │
│    └───────────┴──────────┴────────────────────┘           │
│         All changes batched into single API call           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 6.4 Sync Retry Logic

```typescript
// Exponential backoff for failed syncs
const MAX_RETRIES = 3;
const BACKOFF_BASE = 1000; // 1 second

async function syncWithRetry(attempt = 1): Promise<boolean> {
  try {
    await performSync();
    return true;
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error('Sync failed after max retries');
      return false;
    }
    
    const delay = BACKOFF_BASE * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    return syncWithRetry(attempt + 1);
  }
}

// Retry schedule: 1s → 2s → 4s
```

### 6.5 Cart Context

**File:** `lib/cart-context.tsx`

```typescript
interface CartContextType {
  cart: CartItem[];
  cartLoading: boolean;
  addToCart: (item: CartItemInput) => Promise<void>;
  updateCartItem: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  removeFromCart: (productId: string, size?: string, color?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  addedAt: Date;
}
```

### 6.6 Wishlist Context

**File:** `lib/wishlist-context.tsx`

```typescript
interface WishlistContextType {
  wishlist: string[];  // Product IDs
  wishlistLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (productId: string, size?: string, color?: string) => Promise<void>;
}
```

### 6.7 Tab Close Handling

```typescript
// Ensure data is saved when user closes tab
useEffect(() => {
  const handleBeforeUnload = () => {
    if (userCache.hasPendingChanges()) {
      // Use sendBeacon for reliable delivery
      navigator.sendBeacon('/api/user/sync', JSON.stringify({
        cart: userCache.getCart(),
        wishlist: userCache.getWishlist(),
      }));
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

---

## 7. Product System

### 7.1 Product Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT DATA FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │   Component  │ useProducts() / useProduct()                 │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                      │
│   │        Product Cache (Client)        │                      │
│   │  ┌────────────────────────────────┐  │                      │
│   │  │ localStorage with 5-min TTL    │  │                      │
│   │  └────────────────────────────────┘  │                      │
│   └──────────────┬───────────────────────┘                      │
│                  │                                              │
│          ┌───────┴───────┐                                      │
│          │ Cache Valid?  │                                      │
│          └───────┬───────┘                                      │
│             Yes  │  No                                          │
│          ┌───────┴───────┐                                      │
│          ▼               ▼                                      │
│   Return Cached    Fetch from API                               │
│      Data          /api/shop                                    │
│                          │                                      │
│                          ▼                                      │
│                 ┌─────────────────┐                             │
│                 │    MongoDB      │                             │
│                 │   Products      │                             │
│                 └─────────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Product Hooks

**File:** `lib/use-products.ts`

```typescript
// Fetch multiple products by ID (for cart/wishlist display)
export function useProducts(productIds: string[]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ... fetch logic with cache-first approach
}

// Fetch single product by ID
export function useProduct(productId: string) {
  // Similar pattern, single product
}

// Fetch featured products with filters
export function useFeaturedProducts(filters?: ProductFilters) {
  // For homepage featured section
}

// Fetch all products (shop page - always fresh)
export function useAllProducts(filters: ShopFilters) {
  // Always bypasses cache for fresh data
}
```

### 7.3 Product Cache

**File:** `lib/product-cache.ts`

```typescript
interface CachedProduct {
  data: Product;
  timestamp: number;
}

class ProductCache {
  private static CACHE_KEY = 'sutr_product_cache';
  private static TTL = 5 * 60 * 1000; // 5 minutes

  getProduct(id: string): Product | null;
  setProduct(id: string, product: Product): void;
  getProducts(ids: string[]): { cached: Product[], missing: string[] };
  setProducts(products: Product[]): void;
  preloadProducts(ids: string[]): Promise<void>;
  isExpired(timestamp: number): boolean;
  clear(): void;
}
```

### 7.4 Shop Page Filtering

```
GET /api/shop?
  category=mens
  &subcategory=tees
  &minPrice=500
  &maxPrice=2000
  &tags=oversized,sustainable
  &search=vintage
  &featured=true
  &inStock=true
  &page=1
  &limit=12
```

### 7.5 Stock Management

Products support two stock models:

**Model A: General Stock (Single Number)**

```typescript
{
  inStock: true,
  stock: 50  // Total available
}
```

**Model B: Per-Size Stock (Arrays)**

```typescript
{
  sizes: ['S', 'M', 'L', 'XL'],
  inStock: [true, true, false, true],  // Per-size availability
  stock: [10, 15, 0, 8]                 // Per-size quantities
}
```

**Utility Function:**

```typescript
function getStockForSize(product: Product, size: string): number {
  if (Array.isArray(product.stock)) {
    const sizeIndex = product.sizes.indexOf(size);
    return sizeIndex >= 0 ? product.stock[sizeIndex] : 0;
  }
  return product.stock;
}
```

---

## 8. Cart & Wishlist

### 8.1 Cart Item Structure

```typescript
interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  addedAt: Date;
}
```

### 8.2 Cart Operations

#### Add to Cart

```
1. Check if item with same productId + size + color exists
2. If exists: Increment quantity
3. If new: Add new cart item
4. Update local cache immediately
5. Schedule debounced server sync
```

#### Update Cart Item

```
1. Find item by productId + size + color
2. Update quantity (or size/color if changing variant)
3. If quantity = 0: Remove item
4. Update local cache
5. Schedule sync
```

#### Remove from Cart

```
1. Filter out item matching productId + size + color
2. Update local cache
3. Schedule sync
```

### 8.3 Wishlist Operations

#### Add to Wishlist

```
1. Check if productId already exists (prevent duplicates)
2. Add productId to wishlist array
3. Update local cache
4. Schedule sync
```

#### Move to Cart

```
1. Remove from wishlist
2. Add to cart with default or selected size/color
3. Update local cache for both
4. Schedule sync
```

### 8.4 Cart Display Logic

```typescript
// Cart page fetches full product data for display
const { products, loading } = useProducts(cart.map(item => item.productId));

// Merge cart items with product data
const cartWithProducts = cart.map(item => {
  const product = products.find(p => p.id === item.productId);
  return {
    ...item,
    product,
    lineTotal: product ? product.price * item.quantity : 0,
  };
});
```

---

## 9. Checkout & Payment Flow

### 9.1 Complete Checkout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHECKOUT FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │  Cart Page   │ User reviews cart items                      │
│   └──────┬───────┘                                              │
│          │ Click "Checkout"                                     │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │  Auth Check  │ Redirect to login if not authenticated       │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                      │
│   │         Checkout Page                │                      │
│   │  ┌────────────────────────────────┐  │                      │
│   │  │ • Select/Add Shipping Address  │  │                      │
│   │  │ • Enter Pincode for delivery   │  │                      │
│   │  │ • Review Order Summary         │  │                      │
│   │  └────────────────────────────────┘  │                      │
│   └──────────────┬───────────────────────┘                      │
│                  │                                              │
│          ┌───────┴───────┐                                      │
│          │ Check Pincode │ /api/shipping/serviceability         │
│          │ Serviceability│                                      │
│          └───────┬───────┘                                      │
│          Not     │  Serviceable                                 │
│       Serviceable│                                              │
│          │       │                                              │
│          ▼       ▼                                              │
│   Show Error  ┌──────────────┐                                  │
│               │ Click "Pay"  │                                  │
│               └──────┬───────┘                                  │
│                      │                                          │
│                      ▼                                          │
│          ┌───────────────────────┐                              │
│          │  Create Razorpay      │ /api/payments/create-order   │
│          │  Order (Server)       │                              │
│          └───────────┬───────────┘                              │
│                      │ Returns orderId, amount                  │
│                      ▼                                          │
│          ┌───────────────────────┐                              │
│          │  Razorpay Checkout    │ Client-side modal            │
│          │  (Payment Gateway)    │                              │
│          └───────────┬───────────┘                              │
│             Failed   │  Success                                 │
│          ┌───────────┴───────────┐                              │
│          ▼                       ▼                              │
│   Show Error          ┌───────────────────────┐                 │
│                       │  Verify Payment       │                 │
│                       │  /api/payments/verify │                 │
│                       └───────────┬───────────┘                 │
│                                   │                             │
│                                   ▼                             │
│                       ┌───────────────────────┐                 │
│                       │  Create Order         │                 │
│                       │  /api/orders          │                 │
│                       │  • Generate Order ID  │                 │
│                       │  • Decrement Stock    │                 │
│                       │  • Create Shipment    │                 │
│                       └───────────┬───────────┘                 │
│                                   │                             │
│                                   ▼                             │
│                       ┌───────────────────────┐                 │
│                       │  Clear Cart           │                 │
│                       │  Force Sync           │                 │
│                       └───────────┬───────────┘                 │
│                                   │                             │
│                                   ▼                             │
│                       ┌───────────────────────┐                 │
│                       │  Order Success Page   │                 │
│                       │  /order/success       │                 │
│                       └───────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Razorpay Integration

#### Create Order (Server)

**Endpoint:** `POST /api/payments/create-order`

```typescript
// Request
{
  amount: 1999,      // In INR
  receipt: "order_123",
  notes: {
    userId: "firebase_uid",
    items: "product_ids"
  }
}

// Response
{
  orderId: "order_PJKl...",
  amount: 199900,     // In paise (amount × 100)
  currency: "INR",
  receipt: "order_123"
}
```

#### Client-Side Checkout

```typescript
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: order.amount,
  currency: order.currency,
  name: 'Sutr Clothing',
  description: 'Order Payment',
  order_id: order.orderId,
  handler: async (response) => {
    // Verify payment on server
    await verifyPayment(response);
  },
  prefill: {
    name: user.name,
    email: user.email,
    contact: user.phone,
  },
  theme: {
    color: '#000000',
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

#### Verify Payment (Server)

**Endpoint:** `POST /api/payments/verify`

```typescript
// Request
{
  razorpay_order_id: "order_PJKl...",
  razorpay_payment_id: "pay_PJKm...",
  razorpay_signature: "hmac_sha256_signature"
}

// Verification
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

if (signature === expectedSignature) {
  // Payment verified - proceed with order creation
}
```

### 9.3 Stock Decrement Logic

```typescript
// After successful payment, decrement stock for each item
for (const item of orderItems) {
  const product = await Product.findById(item.productId);
  
  if (Array.isArray(product.stock)) {
    // Per-size stock
    const sizeIndex = product.sizes.indexOf(item.size);
    product.stock[sizeIndex] -= item.quantity;
    
    if (product.stock[sizeIndex] <= 0) {
      product.inStock[sizeIndex] = false;
    }
  } else {
    // General stock
    product.stock -= item.quantity;
    
    if (product.stock <= 0) {
      product.inStock = false;
    }
  }
  
  await product.save();
}
```

### 9.4 Order ID Generation

```typescript
// Brand-friendly order ID format: SUTR_XXXXXX
function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SUTR_';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Example: SUTR_A7K9M2
```

---

## 10. Shipping Integration

### 10.1 Ekart Logistics Overview

Sutr uses **Ekart Logistics** (Flipkart's logistics arm) for shipping:

- **API Base URL:** `https://app.elite.ekartlogistics.in`
- **Authentication:** OAuth 2.0 Bearer Token (24-hour validity)
- **Shipment Types:** Forward (prepaid only)
- **Features:** Real-time tracking, webhook status updates

### 10.2 OAuth Token Management

**File:** `lib/ekart-auth.ts`

```typescript
interface CachedToken {
  accessToken: string;
  expiresAt: number;  // Timestamp
}

class EkartAuth {
  private static cachedToken: CachedToken | null = null;
  private static SAFETY_MARGIN = 60 * 60 * 1000; // 1 hour before expiry

  async getAccessToken(): Promise<string> {
    // Check cached token
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    // Fetch new token
    const response = await fetch(
      `${EKART_BASE_URL}/integrations/v2/auth/token/${CLIENT_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: EKART_USERNAME,
          password: EKART_PASSWORD,
        }),
      }
    );

    const { access_token, expires_in } = await response.json();

    // Cache with safety margin
    this.cachedToken = {
      accessToken: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - this.SAFETY_MARGIN,
    };

    return access_token;
  }
}
```

### 10.3 Serviceability Check

**Endpoint:** `GET /api/shipping/serviceability/[pincode]`

```typescript
// Check if delivery is available for pincode
async function checkServiceability(pincode: string): Promise<{
  serviceable: boolean;
  estimatedDays: number;
}> {
  const token = await ekartAuth.getAccessToken();
  
  const response = await fetch(
    `${EKART_BASE_URL}/api/v2/serviceability?pincode=${pincode}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  
  const data = await response.json();
  
  return {
    serviceable: data.status === 'serviceable',
    estimatedDays: data.tat || 3,  // Default 3 days
  };
}
```

### 10.4 Create Shipment

**Endpoint:** `POST /api/shipping/create`

```typescript
// Shipment creation payload
const shipmentPayload = {
  // Order details
  merchant_reference_id: order.id,  // SUTR_XXXXXX
  payment_mode: 'Prepaid',          // Only prepaid supported
  
  // Package details
  product_name: 'Apparel',
  product_quantity: totalItems,
  product_value: order.total,
  weight: calculateWeight(order.items),  // in grams
  
  // Customer (drop) location
  drop_location: {
    address: order.shippingAddress.addressLine1,
    address2: order.shippingAddress.addressLine2,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
    pincode: order.shippingAddress.postalCode,
    country: 'India',
    contact_name: order.shippingAddress.fullName,
    contact_number: order.shippingAddress.phone,
  },
  
  // Warehouse (pickup) location - from env
  pickup_location: {
    // ... warehouse address from environment
  },
};

// Response includes
{
  awb: '12345678901234',
  tracking_id: 'EKART_TRACK_123',
  label_url: 'https://...',
  courier_partner: 'Ekart',
}
```

### 10.5 Webhook Status Updates

**Endpoint:** `POST /api/shipping/webhook`

```typescript
// Ekart sends status updates via webhook
const webhookPayload = {
  awb: '12345678901234',
  status: 'Out for Delivery',
  status_code: 'OFD',
  timestamp: '2026-02-11T10:30:00Z',
  location: 'Mumbai Hub',
  signature: 'hmac_signature',
};

// Verify webhook signature
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

if (payload.signature !== expectedSignature) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}

// Update order status
const statusMap = {
  'PKD': 'packed',
  'SHP': 'shipped',
  'OFD': 'out for delivery',
  'DLV': 'delivered',
  'CAN': 'cancelled',
  'RTO': 'returned',
};

await Order.findOneAndUpdate(
  { 'shipping.awb': payload.awb },
  {
    $set: {
      orderStatus: statusMap[payload.status_code],
      'shipping.status': payload.status,
    },
    $push: {
      'shipping.statusHistory': {
        status: payload.status,
        timestamp: payload.timestamp,
        location: payload.location,
      },
    },
  }
);
```

### 10.6 Shipment Tracking Flow (Proposed)

```
┌─────────────────────────────────────────────────────────────────┐
│                 SHIPMENT LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Order Created                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────┐     Webhook: PKD                              │
│  │  Processing  │ ──────────────────────────►  Packed           │
│  └──────────────┘                                               │
│                                                                 │
│  ┌──────────────┐     Webhook: SHP                              │
│  │    Packed    │ ──────────────────────────►  Shipped          │
│  └──────────────┘                                               │
│                                                                 │
│  ┌──────────────┐     Webhook: OFD                              │
│  │   Shipped    │ ──────────────────────────►  Out for Delivery │
│  └──────────────┘                                               │
│                                                                 │
│  ┌──────────────┐     Webhook: DLV                              │
│  │Out for Deliv.│ ──────────────────────────►  Delivered        │
│  └──────────────┘                                               │
│                                                                 │
│                   Each webhook updates:                         │
│                   • order.orderStatus                           │
│                   • order.shipping.status                       │
│                   • order.shipping.statusHistory[]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Database Models

### 11.1 Product Model

**File:** `lib/models/Product.ts`

```typescript
const ProductSchema = new Schema({
  // Basic Info
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  
  // Pricing
  price: { type: Number, required: true },
  salePrice: { type: Number },  // Optional sale price
  
  // Images (Cloudinary URLs)
  images: [{ type: String }],
  
  // Categorization
  category: { type: String, required: true },
  subcategory: { type: String },
  tags: [{ type: String }],
  
  // Variants
  sizes: [{ type: String }],
  colors: [{ type: String }],
  
  // Stock - Supports single number or per-size array
  inStock: { type: Schema.Types.Mixed, default: true },
  stock: { type: Schema.Types.Mixed, default: 0 },
  
  // Flags
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  
  // Product Details (for description tab)
  color: String,
  fit: String,
  fabric: String,
  neck: String,
  
  // Shipping
  weight: { type: Number, default: 300 },  // grams
  
}, { timestamps: true });

// Indexes for efficient queries
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ newArrival: 1 });
ProductSchema.index({ inStock: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: 'text', description: 'text' });  // Text search
```

### 11.2 User Model

**File:** `lib/models/User.ts`

```typescript
const UserSchema = new Schema({
  // Identity
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: String,
  avatar: String,
  
  // Role
  role: {
    type: String,
    enum: ['customer', 'admin', 'super-admin'],
    default: 'customer',
  },
  
  // Addresses
  addresses: [{
    id: String,
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
    isDefault: Boolean,
  }],
  
  // Shopping
  wishlist: [{ type: String }],  // Product IDs
  cart: [{
    productId: String,
    quantity: Number,
    selectedSize: String,
    selectedColor: String,
    addedAt: Date,
  }],
  
  // Preferences
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },
  
}, { timestamps: true, optimisticConcurrency: true });

// Instance methods
UserSchema.methods.addAddress = function(address) { /* ... */ };
UserSchema.methods.updateAddress = function(id, updates) { /* ... */ };
UserSchema.methods.removeAddress = function(id) { /* ... */ };
UserSchema.methods.addToWishlist = function(productId) { /* ... */ };
UserSchema.methods.removeFromWishlist = function(productId) { /* ... */ };
UserSchema.methods.addToCart = function(item) { /* ... */ };
UserSchema.methods.updateCartItem = function(productId, updates) { /* ... */ };
UserSchema.methods.removeFromCart = function(productId, size, color) { /* ... */ };
UserSchema.methods.clearCart = function() { /* ... */ };

// Static methods
UserSchema.statics.findByFirebaseUid = function(uid) { /* ... */ };
UserSchema.statics.findByEmail = function(email) { /* ... */ };
```

### 11.3 Order Model

**File:** `lib/models/Order.ts`

```typescript
const OrderSchema = new Schema({
  // Brand-friendly ID
  id: { type: String, required: true, unique: true },  // SUTR_XXXXXX
  
  // User Reference
  userId: { type: String, required: true },
  
  // Order Items
  items: [{
    productId: String,
    productName: String,
    productImage: String,
    price: Number,
    quantity: Number,
    size: String,
    color: String,
  }],
  
  // Totals
  subtotal: Number,
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number,
  
  // Payment
  paymentMethod: { type: String, default: 'razorpay' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Order Status
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'packed', 'shipped', 
           'out for delivery', 'delivered', 'cancelled', 'returned'],
    default: 'processing',
  },
  
  // Addresses
  shippingAddress: {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  billingAddress: { /* Same structure, optional */ },
  
  // Shipping Details (Ekart)
  shipping: {
    awb: String,
    trackingId: String,
    trackingUrl: String,
    labelUrl: String,
    courierPartner: String,
    status: String,
    statusHistory: [{
      status: String,
      timestamp: Date,
      location: String,
    }],
    estimatedDelivery: Date,
    actualDelivery: Date,
    weightInGrams: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
  },
  
  // Notes
  customerNotes: String,
  internalNotes: String,
  
}, { timestamps: true });

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ 'shipping.awb': 1 });
```

### 11.4 Banner Model

**File:** `lib/models/Banner.ts`

```typescript
const BannerSchema = new Schema({
  mobileBanners: [{
    url: String,            // Cloudinary URL
    cloudinaryPublicId: String,
    order: Number,          // Display order
    link: String,           // Click destination
  }],
  desktopBanners: [{
    url: String,
    cloudinaryPublicId: String,
    order: Number,
    link: String,
  }],
}, { timestamps: true });
```

### 11.5 SiteSettings Model

**File:** `lib/models/SiteSettings.ts`

```typescript
const SiteSettingsSchema = new Schema({
  maintenance: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure only one document exists
SiteSettingsSchema.pre('save', async function(next) {
  const count = await this.constructor.countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one SiteSettings document allowed');
  }
  next();
});
```

---

## 12. API Reference

### 12.0 API Endpoints Summary Table

| Method | Endpoint | Auth | Description | Request Body | Response |
|--------|----------|------|-------------|--------------|----------|
| **Shop/Products** |||||
| `GET` | `/api/shop` | - | List all products | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?category=X` | - | Filter by category | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?subcategory=X` | - | Filter by subcategory | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?minPrice=X&maxPrice=Y` | - | Filter by price range | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?tags=X,Y,Z` | - | Filter by tags | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?search=X` | - | Text search | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?featured=true` | - | Featured products only | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?inStock=true` | - | In-stock only | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?ids=X,Y,Z` | - | Get specific products | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop?page=X&limit=Y` | - | Paginated results | - | `{ products[], total, page, totalPages }` |
| `GET` | `/api/shop/[slug]` | - | Get single product | - | `Product` |
| `GET` | `/api/shop/featured` | - | Get featured products | - | `Product[]` |
| `GET` | `/api/shop/featured?limit=X` | - | Limit featured results | - | `Product[]` |
| **Cart** |||||
| `GET` | `/api/cart` | ✓ Bearer | Get user's cart | - | `{ cart[] }` |
| `POST` | `/api/cart` | ✓ Bearer | Add item to cart | `{ productId, quantity, selectedSize?, selectedColor? }` | `{ cart[] }` |
| `PATCH` | `/api/cart` | ✓ Bearer | Update entire cart | `{ cart[] }` | `{ cart[] }` |
| `DELETE` | `/api/cart` | ✓ Bearer | Remove item from cart | `{ productId, selectedSize?, selectedColor? }` | `{ cart[] }` |
| **Wishlist** |||||
| `GET` | `/api/wishlist` | ✓ Bearer | Get user's wishlist | - | `{ wishlist[] }` |
| `POST` | `/api/wishlist` | ✓ Bearer | Add to wishlist | `{ productId }` | `{ wishlist[] }` |
| `DELETE` | `/api/wishlist` | ✓ Bearer | Remove from wishlist | `{ productId }` | `{ wishlist[] }` |
| `PUT` | `/api/wishlist` | ✓ Bearer | Replace entire wishlist | `{ wishlist[] }` | `{ wishlist[] }` |
| **Orders** |||||
| `POST` | `/api/orders` | ✓ Bearer | Create new order | `{ items[], shippingAddress, paymentDetails, total }` | `{ order }` |
| `GET` | `/api/orders?userId=X` | ✓ Bearer | Get user's orders | - | `{ orders[] }` |
| `GET` | `/api/orders?orderId=X` | ✓ Bearer | Get single order | - | `{ order }` |
| **Payments** |||||
| `POST` | `/api/payments/create-order` | ✓ Bearer | Create Razorpay order | `{ amount, receipt, notes? }` | `{ orderId, amount, currency, receipt }` |
| `POST` | `/api/payments/verify` | ✓ Bearer | Verify payment signature | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ verified }` |
| **Shipping** |||||
| `GET` | `/api/shipping/serviceability/[pincode]` | - | Check delivery availability | - | `{ serviceable, estimatedDays }` |
| `POST` | `/api/shipping/create` | ✓ Bearer | Create shipment | `{ orderId }` | `{ awb, trackingId, labelUrl, courierPartner }` |
| `POST` | `/api/shipping/webhook` | Signature | Ekart status webhook | `{ awb, status, status_code, timestamp, location, signature }` | `{ success }` |
| **Users** |||||
| `GET` | `/api/users?firebaseUid=X` | ✓ Bearer | Get user by Firebase UID | - | `{ user }` |
| `POST` | `/api/users` | - | Create new user | `{ firebaseUid, email, name, phone?, avatar? }` | `{ user }` |
| `PATCH` | `/api/users/[id]` | ✓ Bearer | Update user profile | `{ name?, phone?, avatar?, addresses?, preferences? }` | `{ user }` |
| **User Sync** |||||
| `POST` | `/api/user/sync` | ✓ Bearer | Sync cart/wishlist | `{ cart[], wishlist[] }` | `{ success }` |
| **Banners** |||||
| `GET` | `/api/banners` | - | Get homepage banners | - | `{ mobileBanners[], desktopBanners[] }` |
| **Site Settings** |||||
| `GET` | `/api/site-settings` | - | Get maintenance status | - | `{ maintenance }` |

### 12.1 Shop API

#### List Products

```
GET /api/shop

Query Parameters:
- category: string      (filter by category)
- subcategory: string   (filter by subcategory)
- minPrice: number      (minimum price filter)
- maxPrice: number      (maximum price filter)
- tags: string          (comma-separated tags)
- search: string        (text search in name/description)
- featured: boolean     (only featured products)
- inStock: boolean      (only in-stock products)
- ids: string           (comma-separated product IDs)
- page: number          (pagination, default: 1)
- limit: number         (items per page, default: 12)

Response: {
  products: Product[],
  total: number,
  page: number,
  totalPages: number
}
```

#### Get Single Product

```
GET /api/shop/[slug]

Response: Product | 404
```

#### Get Featured Products

```
GET /api/shop/featured

Query Parameters:
- limit: number (default: 8)

Response: Product[]
```

### 12.2 Cart API

#### Get Cart

```
GET /api/cart
Headers: Authorization: Bearer <token>

Response: {
  cart: CartItem[]
}
```

#### Add to Cart

```
POST /api/cart
Headers: Authorization: Bearer <token>
Body: {
  productId: string,
  quantity: number,
  selectedSize?: string,
  selectedColor?: string
}

Response: {
  cart: CartItem[]
}
```

#### Update Cart Item

```
PATCH /api/cart
Headers: Authorization: Bearer <token>
Body: {
  cart: CartItem[]  // Full cart replacement
}

Response: {
  cart: CartItem[]
}
```

#### Remove from Cart

```
DELETE /api/cart
Headers: Authorization: Bearer <token>
Body: {
  productId: string,
  selectedSize?: string,
  selectedColor?: string
}

Response: {
  cart: CartItem[]
}
```

### 12.3 Wishlist API

#### Get Wishlist

```
GET /api/wishlist
Headers: Authorization: Bearer <token>

Response: {
  wishlist: string[]  // Product IDs
}
```

#### Add to Wishlist

```
POST /api/wishlist
Headers: Authorization: Bearer <token>
Body: {
  productId: string
}

Response: {
  wishlist: string[]
}
```

#### Remove from Wishlist

```
DELETE /api/wishlist
Headers: Authorization: Bearer <token>
Body: {
  productId: string
}

Response: {
  wishlist: string[]
}
```

#### Replace Wishlist (Sync)

```
PUT /api/wishlist
Headers: Authorization: Bearer <token>
Body: {
  wishlist: string[]
}

Response: {
  wishlist: string[]
}
```

### 12.4 Orders API

#### Create Order

```
POST /api/orders
Headers: Authorization: Bearer <token>
Body: {
  items: OrderItem[],
  shippingAddress: Address,
  paymentDetails: {
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  },
  total: number
}

Response: {
  order: Order
}
```

#### Get Orders

```
GET /api/orders?userId=<firebaseUid>
Headers: Authorization: Bearer <token>

Response: {
  orders: Order[]
}
```

#### Get Single Order

```
GET /api/orders?orderId=<orderId>
Headers: Authorization: Bearer <token>

Response: {
  order: Order
}
```

### 12.5 Payments API

#### Create Razorpay Order

```
POST /api/payments/create-order
Headers: Authorization: Bearer <token>
Body: {
  amount: number,  // In INR
  receipt: string,
  notes?: object
}

Response: {
  orderId: string,
  amount: number,  // In paise
  currency: "INR",
  receipt: string
}
```

#### Verify Payment

```
POST /api/payments/verify
Headers: Authorization: Bearer <token>
Body: {
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
}

Response: {
  verified: boolean
}
```

### 12.6 Shipping API

#### Check Serviceability

```
GET /api/shipping/serviceability/[pincode]

Response: {
  serviceable: boolean,
  estimatedDays: number
}
```

#### Create Shipment

```
POST /api/shipping/create
Headers: Authorization: Bearer <token>
Body: {
  orderId: string
}

Response: {
  awb: string,
  trackingId: string,
  trackingUrl: string,
  labelUrl: string,
  courierPartner: string
}
```

#### Webhook (Ekart → Server)

```
POST /api/shipping/webhook
Body: {
  awb: string,
  status: string,
  status_code: string,
  timestamp: string,
  location: string,
  signature: string
}

Response: { success: true }
```

### 12.7 Users API

#### Get User

```
GET /api/users?firebaseUid=<uid>
Headers: Authorization: Bearer <token>

Response: {
  user: User
}
```

#### Create User

```
POST /api/users
Body: {
  firebaseUid: string,
  email: string,
  name: string,
  phone?: string,
  avatar?: string
}

Response: {
  user: User
}
```

#### Update User

```
PATCH /api/users/[id]
Headers: Authorization: Bearer <token>
Body: {
  name?: string,
  phone?: string,
  avatar?: string,
  addresses?: Address[],
  preferences?: Preferences
}

Response: {
  user: User
}
```

### 12.8 Site Settings API

#### Get Settings

```
GET /api/site-settings

Response: {
  maintenance: boolean
}
```

### 12.9 Banners API

#### Get Banners

```
GET /api/banners

Response: {
  mobileBanners: Banner[],
  desktopBanners: Banner[]
}
```

---

## 13. Caching Strategies

### 13.1 Client-Side Caching

| Cache | Storage | TTL | Purpose |
|-------|---------|-----|---------|
| User Cache | localStorage | 7 days | User profile, cart, wishlist |
| Product Cache | localStorage | 5 minutes | Product data for cart/wishlist display |

### 13.2 Server-Side Caching

**File:** `lib/server-cache.ts`

```typescript
// In-memory cache with TTL
class ServerCache {
  private cache = new Map<string, { data: any; expires: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 13.3 HTTP Caching Headers

```typescript
// Static assets (fonts, icons)
// Cache-Control: public, max-age=31536000, immutable

// Images
// Cache-Control: public, max-age=2592000 (30 days)

// API responses - Products
// Cache-Control: no-store (always fresh for shop)

// API responses - Static content
// Cache-Control: public, max-age=3600, must-revalidate
```

### 13.4 Ekart Token Caching

```typescript
// OAuth token cached in memory
// TTL: 24 hours - 1 hour safety margin = 23 hours
// Refreshed automatically on expiry
```

---

## 14. SEO & PWA Configuration

### 14.1 Metadata Configuration

**File:** `app/metadata.ts`

```typescript
export const defaultMetadata: Metadata = {
  metadataBase: new URL('https://sutr.store'),
  title: {
    default: 'Sutr Clothing | Modern Streetwear with Indian Soul',
    template: '%s | Sutr Clothing',
  },
  description: 'Premium oversized tees, hoodies, and streetwear...',
  keywords: [
    'streetwear', 'Indian streetwear', 'oversized tees',
    'sustainable fashion', 'modern clothing', 'hoodies',
    // ... 18 total keywords
  ],
  authors: [{ name: 'Sutr Clothing' }],
  creator: 'Sutr Clothing',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sutr.store',
    siteName: 'Sutr Clothing',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@sutrclothing',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};
```

### 14.2 Dynamic Sitemap

**File:** `app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sutr.store';

  // Static pages
  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
    // ... more static pages
  ];

  // Dynamic product pages
  const products = await Product.find({ inStock: true }).select('slug updatedAt');
  const productPages = products.map((product) => ({
    url: `${baseUrl}/shop/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
```

### 14.3 Robots.txt

**File:** `app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account', '/api', '/checkout', '/cart'],
      },
      {
        userAgent: 'Googlebot',
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://sutr.store/sitemap.xml',
  };
}
```

### 14.4 PWA Manifest

**File:** `app/manifest.webmanifest`

```json
{
  "name": "Sutr Clothing",
  "short_name": "Sutr Clothing",
  "description": "Premium oversized tees, hoodies, and streetwear...",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["shopping", "lifestyle", "fashion"],
  "lang": "en-US",
  "dir": "ltr"
}
```

### 14.5 Resource Hints

**File:** `app/resource-hints.tsx`

```typescript
export default function ResourceHints() {
  return (
    <>
      {/* Preconnect to critical origins */}
      <link rel="preconnect" href="https://res.cloudinary.com" />
      <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      <link rel="preconnect" href="https://www.googleapis.com" />
      
      {/* DNS prefetch for less critical origins */}
      <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
    </>
  );
}
```

---

## 15. Security Implementation

### 15.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| **Token Storage** | Firebase handles token storage securely |
| **Token Verification** | Server-side verification via Firebase Admin |
| **Session Management** | Firebase Auth persistence (local) |
| **Password Reset** | Email-based reset via Firebase |

### 15.2 API Security

```typescript
// Bearer token verification pattern
export async function verifyAuth(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
```

### 15.3 Payment Security

| Measure | Implementation |
|---------|----------------|
| **Server-Side Order Creation** | Razorpay orders created on server only |
| **Signature Verification** | HMAC SHA256 verification of payment signatures |
| **Amount Verification** | Server validates amount before order creation |
| **Idempotency** | Razorpay handles duplicate payment prevention |

### 15.4 Webhook Security

```typescript
// Ekart webhook signature verification
function verifyWebhookSignature(payload: any, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.EKART_WEBHOOK_SECRET!)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 15.5 HTTP Security Headers

**File:** `middleware.ts`

```typescript
// Security headers applied via middleware
response.headers.set('X-Content-Type-Options', 'nosniff');
// Additional headers can be added:
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 15.6 Input Validation

```typescript
// Example: Order creation validation
function validateOrderInput(body: any): { valid: boolean; error?: string } {
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return { valid: false, error: 'Items required' };
  }
  
  if (!body.shippingAddress || !body.shippingAddress.postalCode) {
    return { valid: false, error: 'Shipping address required' };
  }
  
  if (typeof body.total !== 'number' || body.total <= 0) {
    return { valid: false, error: 'Invalid total' };
  }
  
  return { valid: true };
}
```

---

## 16. Error Handling

### 16.1 Client-Side Error Handling

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 16.2 API Error Responses

```typescript
// Standard error response format
interface APIError {
  error: string;
  code?: string;
  details?: any;
}

// HTTP Status Codes Used
// 400 - Bad Request (validation errors)
// 401 - Unauthorized (missing/invalid token)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found (resource doesn't exist)
// 409 - Conflict (duplicate, version conflict)
// 500 - Internal Server Error
// 503 - Service Unavailable (database down, retry later)
```

### 16.3 Retry Logic

```typescript
// Client-side retry for transient errors
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Retry on 503 (Service Unavailable)
      if (response.status === 503 && attempt < maxRetries) {
        await delay(1000 * attempt);  // Exponential backoff
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await delay(1000 * attempt);
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### 16.4 Version Conflict Handling

```typescript
// MongoDB VersionError handling (optimistic concurrency)
async function updateUserWithRetry(userId: string, updates: any): Promise<User> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const user = await User.findByIdAndUpdate(userId, updates, { new: true });
      return user;
    } catch (error: any) {
      if (error.name === 'VersionError') {
        // Document was modified, refetch and retry
        const freshUser = await User.findById(userId);
        // Merge changes and retry
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Update failed after retries');
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

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Ekart Logistics
EKART_API_URL=https://app.elite.ekartlogistics.in
EKART_CLIENT_ID=
EKART_USERNAME=
EKART_PASSWORD=
EKART_WEBHOOK_SECRET=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Warehouse Address (for shipping)
WAREHOUSE_NAME=
WAREHOUSE_ADDRESS=
WAREHOUSE_CITY=
WAREHOUSE_STATE=
WAREHOUSE_PINCODE=
WAREHOUSE_PHONE=

# App Config
NEXT_PUBLIC_APP_URL=https://sutr.store
```

### 17.2 Environment-Specific Behavior

```typescript
// Development vs Production differences
const isDev = process.env.NODE_ENV === 'development';

// Logging
if (isDev) {
  console.log('Debug info:', data);
}

// Console removal in production (via next.config.ts)
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' 
    ? { exclude: ['error', 'warn'] } 
    : false,
}
```

---

## 18. Deployment Considerations

### 18.1 Build Configuration

**File:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // Strict checks
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // Image optimization
  images: {
    remotePatterns: [
      { hostname: 'res.cloudinary.com' },
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // Static asset caching
  headers: async () => [
    {
      source: '/:path*.(ico|svg|png|jpg|jpeg|gif|webp|woff|woff2)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],

  // Firebase HMR stability
  experimental: {
    turbo: {
      resolveAlias: {
        '@firebase/auth': '@firebase/auth/dist/esm2017/index.js',
      },
    },
  },
};
```

### 18.2 Vercel Deployment

Recommended platform: **Vercel** (native Next.js support)

```
Features Used:
├── Edge Functions (middleware)
├── Serverless Functions (API routes)
├── Static Generation (marketing pages)
├── Image Optimization (Cloudinary)
└── Environment Variables (dashboard)
```

### 18.3 Database Considerations

```
MongoDB Atlas Setup:
├── Cluster: M10+ for production
├── Regions: Mumbai (ap-south-1) for India users
├── Connection Pooling: maxPoolSize=10
├── Indexes: Created via Mongoose schema
└── Backup: Daily automated backups
```

### 18.4 Performance Optimization

| Area | Optimization |
|------|--------------|
| **Images** | Cloudinary auto-format, lazy loading |
| **Fonts** | Local fonts, `font-display: swap` |
| **JS Bundles** | Code splitting, tree shaking |
| **API** | Response compression, caching headers |
| **Database** | Indexed queries, connection pooling |

### 18.5 Monitoring Recommendations

```
Suggested Tools:
├── Vercel Analytics (Core Web Vitals)
├── Sentry (Error tracking)
├── MongoDB Atlas Monitoring (Database)
└── Razorpay Dashboard (Payments)
```

---

## Appendix A: Common Workflows

### A.1 New User Registration

```
1. User fills signup form
2. Firebase creates auth account
3. API creates MongoDB user document
4. User automatically signed in
5. Empty cart/wishlist initialized
6. Redirect to account page
```

### A.2 Product Purchase

```
1. User browses /shop
2. Adds product to cart (size/color selection)
3. Cart syncs to server (debounced)
4. User proceeds to checkout
5. Address selection/entry
6. Pincode serviceability check
7. Razorpay payment modal
8. Payment verification
9. Order creation + stock decrement
10. Ekart shipment creation
11. Cart cleared
12. Order success page
```

### A.3 Order Tracking

```
1. Ekart sends webhook on status change
2. Server verifies webhook signature
3. Order status updated in MongoDB
4. Status history appended
5. User views status on /account/orders
6. "Track Order" opens Ekart tracking page
```

---

## Appendix B: File Quick Reference

| Need To... | File Location |
|------------|---------------|
| Add API endpoint | `app/api/<endpoint>/route.ts` |
| Create new page | `app/<route>/page.tsx` |
| Add component | `components/<Name>.tsx` |
| Modify auth flow | `lib/auth-context.tsx` |
| Change cart logic | `lib/cart-context.tsx` |
| Update database schema | `lib/models/<Model>.ts` |
| Add environment var | `.env.local` + `next.config.ts` |
| Modify SEO | `app/metadata.ts` |
| Change styling | `tailwind.config.js` |
| Add middleware | `middleware.ts` |

---

## Appendix C: Type Definitions

**File:** `types/index.d.ts`

Key interfaces defined:

- `Product`
- `User` / `MongoUser`
- `CartItem`
- `Order`
- `Address`
- `Banner`
- `SiteSettings`

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.6.2 | Feb 11, 2026 | [Itesh Tomar](https://github.com/iteshxt) | Initial comprehensive documentation |

---

*This document was created based on codebase analysis. For the most up-to-date information, always refer to the source code.*
