import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

// GET user orders
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminUser = await verifyAdminToken(token);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const { id } = await params;

        // Connect to MongoDB
        await dbConnect();

        // First, find the user to get their Firebase UID
        // The id parameter is the MongoDB _id
        const user = await User.findById(id).select('firebaseUid').lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch orders for this user using their Firebase UID (which is stored in orders as userId)
        const orders = await Order.find({ userId: user.firebaseUid })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Map database field names to expected frontend field names
        const mappedOrders = orders.map((order: any) => ({
            ...order,
            // Ensure total is a number
            total: order.total ?? order.totalAmount ?? 0,
            // Ensure status is correct
            status: order.status ?? order.orderStatus ?? 'pending',
            // Map item fields: ensure they have the correct structure
            items: order.items?.map((item: any) => ({
                ...item,
                name: item.name ?? item.productName ?? 'Unknown Product',
                image: item.image ?? item.productImage ?? null,
                price: Number(item.price) ?? 0,
                quantity: Number(item.quantity) ?? 1,
            })) ?? [],
            // Convert orderNumber to be used as display ID
            _id: order._id?.toString?.() || order._id,
            orderNumber: order.orderNumber || order._id?.toString?.() || '',
        }));

        return NextResponse.json({ orders: mappedOrders });

    } catch (error: any) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders', details: error.message },
            { status: 500 }
        );
    }
}
