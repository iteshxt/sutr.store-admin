import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { verifyAdminAuth } from '@/lib/auth-admin';

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
        const body = await request.json();
        const { deviceType, publicId } = body;

        if (!deviceType || !publicId) {
            return NextResponse.json(
                { error: 'deviceType and publicId are required' },
                { status: 400 }
            );
        }

        if (!['mobile', 'desktop'].includes(deviceType)) {
            return NextResponse.json(
                { error: 'deviceType must be either "mobile" or "desktop"' },
                { status: 400 }
            );
        }

        // Remove banner from the appropriate array
        const field = deviceType === 'mobile' ? 'mobileBanners' : 'desktopBanners';
        const updateData = {
            $pull: {
                [field]: { cloudinaryPublicId: publicId },
            },
        };

        const updatedBanners = await Banner.findByIdAndUpdate(id, updateData, {
            new: true,
        }).lean();

        if (!updatedBanners) {
            return NextResponse.json(
                { error: 'Banners not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${deviceType} banner deleted successfully`,
            data: updatedBanners,
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
        const body = await request.json();
        const { deviceType, bannerOrder, publicId } = body;

        if (!deviceType || bannerOrder === undefined) {
            return NextResponse.json(
                { error: 'deviceType and bannerOrder are required' },
                { status: 400 }
            );
        }

        if (!['mobile', 'desktop'].includes(deviceType)) {
            return NextResponse.json(
                { error: 'deviceType must be either "mobile" or "desktop"' },
                { status: 400 }
            );
        }

        // Get current banners
        const bannerDoc = await Banner.findById(id);
        if (!bannerDoc) {
            return NextResponse.json(
                { error: 'Banners not found' },
                { status: 404 }
            );
        }

        const field = deviceType === 'mobile' ? 'mobileBanners' : 'desktopBanners';
        const banners = bannerDoc[field as keyof typeof bannerDoc] || [];

        // Update the order for the specific banner
        const bannerIndex = banners.findIndex(
            (b: any) => b.cloudinaryPublicId === publicId
        );
        if (bannerIndex !== -1) {
            banners[bannerIndex].order = bannerOrder;
        }

        const updateData = { [field]: banners };
        const updatedBanners = await Banner.findByIdAndUpdate(id, updateData, {
            new: true,
        }).lean();

        return NextResponse.json({
            success: true,
            message: 'Banner order updated successfully',
            data: updatedBanners,
        });
    } catch (error: any) {
        console.error('Error updating banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update banner', message: error.message },
            { status: 500 }
        );
    }
}
