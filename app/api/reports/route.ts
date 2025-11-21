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

        // Sales Report - Include both delivered and shipped orders within date range
        // If no data in range, show data from all time as fallback
        let completedOrders = await Order.find({
            status: { $in: ['delivered', 'shipped'] },
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();

        // If no completed orders in the date range, get all completed orders for context
        if (completedOrders.length === 0) {
            completedOrders = await Order.find({
                status: { $in: ['delivered', 'shipped'] }
            }).lean();
        }

        const totalRevenue = completedOrders.reduce((sum, order: any) => {
            const amount = Number(order.total || order.totalAmount || 0);
            return sum + amount;
        }, 0);
        const totalOrders = completedOrders.length;
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

        // Helper function to get total stock
        const getTotalStock = (stock: number | number[] | undefined): number => {
            if (Array.isArray(stock)) {
                return stock.reduce((sum, s) => sum + (s || 0), 0);
            }
            return stock || 0;
        };

        // Inventory Report
        const allProducts = await Product.find();
        const totalProducts = allProducts.length;
        const lowStockProducts = allProducts.filter(p => {
            const totalStock = getTotalStock(p.stock);
            return totalStock > 0 && totalStock <= 10;
        }).length;
        const outOfStockProducts = allProducts.filter(p => getTotalStock(p.stock) === 0).length;
        const totalInventoryValue = allProducts.reduce((sum, product) => {
            return sum + (Number(product.price) * getTotalStock(product.stock));
        }, 0);

        // Customer Report
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

        const orderReport = {
            pending: allOrdersForStatus.filter(o => o.status === 'pending').length,
            processing: allOrdersForStatus.filter(o => o.status === 'processing').length,
            shipped: allOrdersForStatus.filter(o => o.status === 'shipped').length,
            outForDelivery: allOrdersForStatus.filter(o => o.status === 'out for delivery').length,
            delivered: allOrdersForStatus.filter(o => o.status === 'delivered').length,
            cancelled: allOrdersForStatus.filter(o => o.status === 'cancelled').length,
        };

        // Compile final report
        const report = {
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
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate reports'
            },
            { status: 500 }
        );
    }
}
