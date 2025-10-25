import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import clientPromise from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminUser = await verifyAdminToken(token);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        await clientPromise;

        // Get date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // 1. Revenue Over Time (Last 30 days)
        const revenueByDay = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // 2. Orders by Status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$orderStatus', '$status'] },
                    count: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
                },
            },
        ]);

        // 3. Top Selling Products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: { $ifNull: ['$items.productName', '$items.name'] } },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
        ]);

        // 4. Customer Growth
        const customerGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    newCustomers: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // 5. Revenue by Category (from products in orders)
        const revenueByCategory = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$product.category',
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    quantity: { $sum: '$items.quantity' },
                },
            },
            { $sort: { revenue: -1 } },
        ]);

        // 6. Average Order Value
        const avgOrderValue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    avgValue: { $avg: { $ifNull: ['$totalAmount', '$total'] } },
                    minValue: { $min: { $ifNull: ['$totalAmount', '$total'] } },
                    maxValue: { $max: { $ifNull: ['$totalAmount', '$total'] } },
                },
            },
        ]);

        // 7. Conversion Metrics
        const totalUsers = await User.countDocuments();
        const usersWithOrders = await Order.distinct('userId');
        const conversionRate = totalUsers > 0 ? (usersWithOrders.length / totalUsers) * 100 : 0;

        // 8. Recent Activity (Last 7 days)
        const recentActivity = {
            orders: await Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            revenue: await Order.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } },
            ]),
            newCustomers: await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        };

        // 9. Monthly Comparison
        const thisMonthRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } },
        ]);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } },
        ]);

        // 10. Product Performance
        const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });
        const totalProducts = await Product.countDocuments();
        const outOfStockProducts = await Product.countDocuments({ stock: 0 });

        return NextResponse.json({
            success: true,
            statistics: {
                revenueByDay,
                ordersByStatus,
                topProducts,
                customerGrowth,
                revenueByCategory,
                averageOrderValue: avgOrderValue[0] || { avgValue: 0, minValue: 0, maxValue: 0 },
                conversionRate: conversionRate.toFixed(2),
                recentActivity: {
                    orders: recentActivity.orders,
                    revenue: recentActivity.revenue[0]?.total || 0,
                    newCustomers: recentActivity.newCustomers,
                },
                monthlyComparison: {
                    thisMonth: thisMonthRevenue[0]?.total || 0,
                    lastMonth: lastMonthRevenue[0]?.total || 0,
                },
                productMetrics: {
                    total: totalProducts,
                    lowStock: lowStockProducts,
                    outOfStock: outOfStockProducts,
                },
            },
        });
    } catch (error: any) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics', details: error.message },
            { status: 500 }
        );
    }
}
