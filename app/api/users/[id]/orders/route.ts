import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import clientPromise from '@/lib/mongodb';
import Order from '@/lib/models/Order';

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
        await clientPromise;

        // Fetch orders for this user, sorted by most recent first
        const orders = await Order.find({ userId: id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return NextResponse.json({ orders });

    } catch (error: any) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders', details: error.message },
            { status: 500 }
        );
    }
}
