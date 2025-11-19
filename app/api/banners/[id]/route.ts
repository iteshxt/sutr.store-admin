import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { verifyAdminAuth } from '@/lib/auth-admin';
import mongoose from 'mongoose';

export async function DELETE(
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
        const objectId = new mongoose.Types.ObjectId(id);

        const banner = await Banner.findByIdAndDelete(objectId);

        if (!banner) {
            return NextResponse.json(
                { error: 'Banner not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Banner deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete banner', message: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
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
        const objectId = new mongoose.Types.ObjectId(id);
        const body = await request.json();

        const { title, link, isActive } = body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (link !== undefined) updateData.link = link;
        if (isActive !== undefined) updateData.isActive = isActive;

        const collection = Banner.collection;
        await collection.updateOne(
            { _id: objectId },
            { $set: updateData }
        );

        const updatedBanner = await Banner.findById(objectId).lean();

        return NextResponse.json({
            success: true,
            message: 'Banner updated successfully',
            banner: updatedBanner,
        });
    } catch (error: any) {
        console.error('Error updating banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update banner', message: error.message },
            { status: 500 }
        );
    }
}
