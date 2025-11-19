import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { verifyAdminAuth } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Get active banner
        const banner = await Banner.findOne({ isActive: true }).lean();

        if (!banner) {
            return NextResponse.json({
                success: true,
                banner: null,
            });
        }

        return NextResponse.json({
            success: true,
            banner,
        });
    } catch (error: any) {
        console.error('Error fetching banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch banner', message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const { bannerUrl, cloudinaryPublicId, title, link } = body;

        if (!bannerUrl || !cloudinaryPublicId) {
            return NextResponse.json(
                { error: 'Banner URL and cloudinary public ID are required' },
                { status: 400 }
            );
        }

        // Delete old active banner if exists
        const oldBanner = await Banner.findOne({ isActive: true });
        if (oldBanner) {
            // In a real scenario, you'd delete from Cloudinary here
            await Banner.deleteOne({ _id: oldBanner._id });
        }

        // Create new banner
        const newBanner = await Banner.create({
            bannerUrl,
            cloudinaryPublicId,
            title: title || 'Website Banner',
            link: link || null,
            isActive: true,
        });

        return NextResponse.json({
            success: true,
            message: 'Banner uploaded successfully',
            banner: newBanner,
        });
    } catch (error: any) {
        console.error('Error uploading banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload banner', message: error.message },
            { status: 500 }
        );
    }
}
