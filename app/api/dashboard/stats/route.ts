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

        // Connect to MongoDB
        await clientPromise;

        // Get total sales and order count
        const orderStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                },
            },
        ]);

        // Get customer count
        const totalCustomers = await User.countDocuments();

        // Get product count
        const totalProducts = await Product.countDocuments();

        // Get recent orders (last 10)
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Calculate growth percentages (comparing last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [currentPeriodSales, previousPeriodSales] = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
            ]),
        ]);

        const currentSales = currentPeriodSales[0]?.total || 0;
        const previousSales = previousPeriodSales[0]?.total || 1;
        const currentOrders = currentPeriodSales[0]?.count || 0;
        const previousOrders = previousPeriodSales[0]?.count || 1;

        const salesGrowth = ((currentSales - previousSales) / previousSales) * 100;
        const ordersGrowth = ((currentOrders - previousOrders) / previousOrders) * 100;

        // Customer growth
        const [currentCustomers, previousCustomers] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
        ]);

        const customersGrowth = previousCustomers > 0
            ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
            : 0;

        return NextResponse.json({
            success: true,
            stats: {
                totalSales: orderStats[0]?.totalSales || 0,
                totalOrders: orderStats[0]?.totalOrders || 0,
                totalCustomers,
                totalProducts,
                salesGrowth: salesGrowth.toFixed(1),
                ordersGrowth: ordersGrowth.toFixed(1),
                customersGrowth: customersGrowth.toFixed(1),
            },
            recentOrders: recentOrders.map(order => ({
                _id: order._id,
                orderNumber: order.orderNumber,
                customerEmail: order.customerEmail || 'N/A',
                total: order.total,
                status: order.status,
                createdAt: order.createdAt,
                itemCount: order.items?.length || 0,
            })),
        });

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats', details: error.message },
            { status: 500 }
        );
    }
}
