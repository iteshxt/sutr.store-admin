import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import dbConnect from '@/lib/mongodb';
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
        await dbConnect();

        // Get total sales and order count - fetch all orders and sum them
        const allOrders = await Order.find().lean();

        const totalSales = allOrders.reduce((sum, order: any) => {
            const amount = Number(order.totalAmount || order.total || 0);
            return sum + amount;
        }, 0);

        const totalOrders = allOrders.length;

        // Get customer count
        const totalCustomers = await User.countDocuments();

        // Get product count
        const totalProducts = await Product.countDocuments();

        // Get recent orders (last 10) with proper lean() to get raw objects
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Calculate growth percentages (comparing last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Get current period orders
        const currentPeriodOrders = allOrders.filter((order: any) =>
            new Date(order.createdAt) >= thirtyDaysAgo
        );

        const currentSales = currentPeriodOrders.reduce((sum, order: any) => {
            const amount = Number(order.totalAmount || order.total || 0);
            return sum + amount;
        }, 0);
        const currentOrders = currentPeriodOrders.length;

        // Get previous period orders
        const previousPeriodOrders = allOrders.filter((order: any) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
        });

        const previousSales = previousPeriodOrders.reduce((sum, order: any) => {
            const amount = Number(order.totalAmount || order.total || 0);
            return sum + amount;
        }, 0);
        const previousOrders = previousPeriodOrders.length;

        // Calculate growth - handle case where there's no previous data
        let salesGrowth = 0;
        if (previousSales === 0 && currentSales > 0) {
            salesGrowth = 100; // First time data
        } else if (previousSales > 0) {
            salesGrowth = ((currentSales - previousSales) / previousSales) * 100;
        } else {
            salesGrowth = 0;
        }

        let ordersGrowth = 0;
        if (previousOrders === 0 && currentOrders > 0) {
            ordersGrowth = 100; // First time data
        } else if (previousOrders > 0) {
            ordersGrowth = ((currentOrders - previousOrders) / previousOrders) * 100;
        } else {
            ordersGrowth = 0;
        }

        // Customer growth
        const [currentCustomers, previousCustomers] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
        ]);

        let customersGrowth = 0;
        if (previousCustomers === 0 && currentCustomers > 0) {
            customersGrowth = 100; // First time data
        } else if (previousCustomers > 0) {
            customersGrowth = ((currentCustomers - previousCustomers) / previousCustomers) * 100;
        } else {
            customersGrowth = 0;
        }

        // Enrich recent orders with user data
        const enrichedRecentOrders = await Promise.all(
            recentOrders.map(async (order: any) => {
                // Fetch user data using Firebase UID
                const user = await User.findOne({ firebaseUid: order.userId })
                    .select('name email phone avatar')
                    .lean();

                // Ensure total is a number - check both totalAmount and total fields
                const orderTotal = Number(order.totalAmount || order.total || 0);

                return {
                    _id: order._id?.toString?.() || order._id,
                    orderNumber: order.orderNumber || order._id?.toString?.() || '',
                    customerEmail: user?.email || order.customerEmail || 'N/A',
                    customerName: user?.name || order.customerName || 'N/A',
                    total: orderTotal,
                    status: order.status || 'pending',
                    createdAt: order.createdAt,
                    itemCount: order.items?.length || 0,
                };
            })
        );

        // Get pending orders (not shipped, not delivered, not cancelled)
        const pendingStatuses = ['pending', 'processing', 'out for delivery'];
        const pendingOrders = allOrders.filter((order: any) =>
            pendingStatuses.includes(order.status?.toLowerCase())
        );
        const pendingOrdersCount = pendingOrders.length;

        // Get top selling product this month
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const thisMonthOrders = allOrders.filter((order: any) =>
            new Date(order.createdAt) >= thisMonthStart
        );

        // Count items sold by product
        const productSalesMap = new Map<string, { name: string; count: number; productId: string }>();
        thisMonthOrders.forEach((order: any) => {
            if (order.items) {
                order.items.forEach((item: any) => {
                    const productId = item.productId || item.id || '';
                    if (productId) {
                        if (!productSalesMap.has(productId)) {
                            productSalesMap.set(productId, {
                                name: item.name || 'Unknown Product',
                                count: 0,
                                productId: productId,
                            });
                        }
                        const product = productSalesMap.get(productId)!;
                        product.count += item.quantity || 1;
                    }
                });
            }
        });

        // Get top product
        let topProduct = { name: 'No sales', count: 0 };
        if (productSalesMap.size > 0) {
            const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.count - a.count);
            topProduct = {
                name: sortedProducts[0].name,
                count: sortedProducts[0].count,
            };
        }

        // Get order status breakdown
        const statusBreakdown = {
            pending: allOrders.filter((o: any) => o.status === 'pending').length,
            processing: allOrders.filter((o: any) => o.status === 'processing').length,
            shipped: allOrders.filter((o: any) => o.status === 'shipped').length,
            outForDelivery: allOrders.filter((o: any) => o.status === 'out for delivery').length,
            delivered: allOrders.filter((o: any) => o.status === 'delivered').length,
            cancelled: allOrders.filter((o: any) => o.status === 'cancelled').length,
        };

        return NextResponse.json({
            success: true,
            stats: {
                totalSales: totalSales,
                totalOrders: totalOrders,
                totalCustomers,
                totalProducts,
                salesGrowth: isFinite(salesGrowth) ? salesGrowth.toFixed(1) : '0.0',
                ordersGrowth: isFinite(ordersGrowth) ? ordersGrowth.toFixed(1) : '0.0',
                customersGrowth: isFinite(customersGrowth) ? customersGrowth.toFixed(1) : '0.0',
            },
            pendingOrdersCount,
            topProduct,
            statusBreakdown,
            recentOrders: enrichedRecentOrders,
        }, {
            headers: {
                'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            },
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats', details: error.message },
            { status: 500 }
        );
    }
}
