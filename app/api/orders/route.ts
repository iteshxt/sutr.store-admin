import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { verifyAdminAuth } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Build query
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        // Fetch orders with pagination and sorting
        const orders = await Order.find(query)
            .sort({ createdAt: -1 }) // Most recent first
            .limit(limit)
            .skip(skip)
            .lean();

        // Log actual data from DB to see field names
        if (orders.length > 0) {
            console.log('=== RAW ORDER FROM DB ===');
            console.log('Order keys:', Object.keys(orders[0]));
            console.log('Order total:', orders[0].total);
            console.log('Order totalAmount:', (orders[0] as any).totalAmount);
            console.log('Order items:', orders[0].items);
            if (orders[0].items && orders[0].items.length > 0) {
                console.log('First item keys:', Object.keys(orders[0].items[0]));
                console.log('First item:', orders[0].items[0]);
            }
        }

        // Populate user data for each order
        const ordersWithUserData = await Promise.all(
            orders.map(async (order: any) => {
                // userId in orders is the Firebase UID, not MongoDB _id
                const user = await User.findOne({ firebaseUid: order.userId }).select('name email phone avatar').lean();

                // Map database field names to expected frontend field names
                const mappedOrder = {
                    ...order,
                    // Map totalAmount -> total
                    total: order.total ?? order.totalAmount ?? 0,
                    // Map orderStatus -> status
                    status: order.status ?? order.orderStatus ?? 'pending',
                    // Map item fields: productName -> name, productImage -> image
                    items: order.items?.map((item: any) => ({
                        ...item,
                        name: item.name ?? item.productName ?? 'Unknown Product',
                        image: item.image ?? item.productImage ?? null,
                    })) ?? [],
                    // Add user data
                    customerName: user?.name || order.customerName || order.shippingAddress?.fullName || 'N/A',
                    customerEmail: user?.email || order.customerEmail || 'N/A',
                    customerPhone: user?.phone || order.customerPhone || order.shippingAddress?.phone || null,
                    customerAvatar: user?.avatar || null,
                };

                return mappedOrder;
            })
        );

        const total = await Order.countDocuments(query);

        return NextResponse.json({
            success: true,
            orders: ordersWithUserData,
            total,
            limit,
            skip,
        });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders', message: error.message },
            { status: 500 }
        );
    }
}
