import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { verifyAdminAuth } from '@/lib/auth-admin';
import mongoose from 'mongoose';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        const body = await request.json();

        // Validate request body
        const { status, trackingNumber } = body;

        // Build update object
        const updateData: any = {};

        if (status) {
            const validStatuses = ['pending', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: 'Invalid status value' },
                    { status: 400 }
                );
            }
            updateData.status = status;
        }

        if (trackingNumber !== undefined) {
            updateData.trackingNumber = trackingNumber;
        }

        // Update the order using collection.updateOne to bypass Mongoose schema validation
        const collection = Order.collection;
        const objectId = new mongoose.Types.ObjectId(id);

        await collection.updateOne(
            { _id: objectId },
            { $set: updateData }
        );

        // Fetch the updated order
        const updatedOrder = await Order.findById(id).lean();

        if (!updatedOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Enrich order with user data (same as GET /api/orders)
        const user = await User.findOne({ firebaseUid: updatedOrder.userId }).select('name email phone avatar').lean();

        const enrichedOrder = {
            ...updatedOrder,
            items: updatedOrder.items?.map((item: any) => ({
                ...item,
                name: item.name ?? item.productName ?? 'Unknown Product',
                image: item.image ?? item.productImage ?? null,
            })) ?? [],
            customerName: user?.name || updatedOrder.customerName || updatedOrder.shippingAddress?.fullName || 'N/A',
            customerEmail: user?.email || updatedOrder.customerEmail || 'N/A',
            customerPhone: user?.phone || updatedOrder.customerPhone || updatedOrder.shippingAddress?.phone || null,
            customerAvatar: user?.avatar || null,
        };

        return NextResponse.json({
            success: true,
            message: 'Order updated successfully',
            order: enrichedOrder,
        });
    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update order', message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;

        const order = await Order.findById(id).lean();

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            order,
        });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch order', message: error.message },
            { status: 500 }
        );
    }
}
