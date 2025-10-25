// Type definitions for Sutr Admin Dashboard

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    salePrice?: number;
    images: string[];
    category: string;
    subcategory?: string;
    tags?: string[];
    sizes: string[];
    colors: string[];
    inStock: boolean;
    stock?: number;
    featured?: boolean;
    // Product Details for "Additional Information" tab
    productDetails?: {
        color?: string;              // Dynamic from DB - e.g., "White", "Black"
        fit?: string;                // Dynamic from DB - e.g., "Oversized", "Regular"
        fabric?: string;             // Dynamic from DB - e.g., "100% Cotton"
        neck?: string;               // Dynamic from DB - e.g., "Round Neck", "V-Neck"
    };
    // Note: Wash instructions are hardcoded in frontend (same for all products)
    // Note: Care Instructions are hardcoded in frontend (same for all products)
    createdAt?: Date;                // Auto: Creation timestamp
    updatedAt?: Date;                // Auto: Last modified
}

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
}

export interface Address {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface Order {
    _id: string;
    id?: string;
    orderNumber: string;
    userId: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid' | 'completed';
    items: OrderItem[];
    shippingAddress: Address;
    billingAddress?: Address;
    total: number;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    paymentId: string;
    paymentStatus: string;
    paymentMethod?: string;
    trackingNumber?: string;
    notes?: string;
    customerName?: string;
    customerEmail?: string;
    customerAvatar?: string;
    customerPhone?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User {
    _id?: string;
    id?: string;
    firebaseUid: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
    addresses?: Address[];
    role?: 'customer' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DashboardStats {
    totalSales: number;
    todaySales: number;
    weekSales: number;
    monthSales: number;
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
}

export interface SalesData {
    date: string;
    sales: number;
    orders: number;
}

export interface TopProduct {
    productId: string;
    name: string;
    image: string;
    totalSold: number;
    revenue: number;
}
