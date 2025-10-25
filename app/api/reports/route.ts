import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const isAdmin = await verifyAdminToken(token);

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        await connectDB();

        // Get date range from query params
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30days';

        let startDate: Date;
        const endDate = new Date();

        switch (range) {
            case '7days':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30days':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90days':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 90);
                break;
            case 'all':
            default:
                startDate = new Date(0); // Beginning of time
                break;
        }

        // Sales Report - Include both delivered and shipped orders
        const completedOrders = await Order.find({
            status: { $in: ['delivered', 'shipped'] },
            createdAt: { $gte: startDate, $lte: endDate }
        });

        console.log('Completed orders count:', completedOrders.length);

        const totalRevenue = completedOrders.reduce((sum, order) => {
            return sum + Number(order.total || 0);
        }, 0); const totalOrders = completedOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Find top selling product
        const productSales: { [key: string]: { name: string; quantity: number } } = {};

        completedOrders.forEach(order => {
            const items = order.items || [];
            items.forEach((item: any) => {
                const productId = item.productId || item.product;
                const productName = item.name || item.productName || 'Unknown Product';
                const quantity = item.quantity || 1;

                if (!productSales[productId]) {
                    productSales[productId] = { name: productName, quantity: 0 };
                }
                productSales[productId].quantity += quantity;
            });
        });

        const topProduct = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0];
        const topSellingProduct = topProduct ? topProduct.name : 'N/A';

        // Inventory Report
        const allProducts = await Product.find();
        const totalProducts = allProducts.length;
        const lowStockProducts = allProducts.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10).length;
        const outOfStockProducts = allProducts.filter(p => (p.stock ?? 0) === 0).length;
        const totalInventoryValue = allProducts.reduce((sum, product) => {
            return sum + (Number(product.price) * Number(product.stock ?? 0));
        }, 0);        // Customer Report
        const allUsers = await User.find();
        const totalCustomers = allUsers.length;

        const newCustomers = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Find users with orders (returning customers)
        const ordersWithCustomers = await Order.distinct('userId');
        const returningCustomers = ordersWithCustomers.length;

        const conversionRate = totalCustomers > 0
            ? ((returningCustomers / totalCustomers) * 100).toFixed(1)
            : '0.0';

        // Order Status Report - Get ALL orders regardless of date range
        const allOrdersForStatus = await Order.find({});

        console.log('Total orders in DB:', allOrdersForStatus.length);
        console.log('Order statuses:', allOrdersForStatus.map(o => o.status));

        const orderReport = {
            pending: allOrdersForStatus.filter(o => o.status === 'pending').length,
            processing: allOrdersForStatus.filter(o => o.status === 'processing').length,
            completed: allOrdersForStatus.filter(o => o.status === 'delivered' || o.status === 'shipped').length,
            cancelled: allOrdersForStatus.filter(o => o.status === 'cancelled').length,
        };

        // Also get orders in date range for other reports
        const allOrders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }); const report = {
            salesReport: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                topSellingProduct,
                periodStart: startDate.toISOString(),
                periodEnd: endDate.toISOString(),
            },
            inventoryReport: {
                totalProducts,
                lowStockProducts,
                outOfStockProducts,
                totalValue: totalInventoryValue,
            },
            customerReport: {
                totalCustomers,
                newCustomers,
                returningCustomers,
                conversionRate,
            },
            orderReport,
        };

        return NextResponse.json({
            success: true,
            report,
        });

    } catch (error) {
        console.error('Reports API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate reports'
            },
            { status: 500 }
        );
    }
}
