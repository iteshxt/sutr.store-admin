import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { verifyAdminAuth } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Get banners - there should only be one document containing both mobile and desktop banners
        let banners = await Banner.findOne().lean();

        if (!banners) {
            // Initialize with empty banners if none exist
            banners = await Banner.create({
                mobileBanners: [],
                desktopBanners: [],
            });
        }

        return NextResponse.json({
            success: true,
            data: banners,
        });
    } catch (error: any) {
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch banners', message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        console.log('🔐 Admin auth verification:', isAdmin);
        if (!isAdmin) {
            console.log('❌ Admin authentication failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ Admin authenticated, connecting to DB...');
        await dbConnect();

        const body = await request.json();
        const { url, cloudinaryPublicId, deviceType } = body;

        console.log('📝 Request body:', { url: url?.substring(0, 50) + '...', cloudinaryPublicId, deviceType });

        if (!url || !cloudinaryPublicId || !deviceType) {
            return NextResponse.json(
                { error: 'url, cloudinaryPublicId, and deviceType are required' },
                { status: 400 }
            );
        }

        if (!['mobile', 'desktop'].includes(deviceType)) {
            return NextResponse.json(
                { error: 'deviceType must be either "mobile" or "desktop"' },
                { status: 400 }
            );
        }

        // Get or create the single banner document
        let bannerDoc = await Banner.findOne();
        console.log('📦 Current banner doc:', bannerDoc ? 'Found' : 'Not found');
        if (!bannerDoc) {
            console.log('🆕 Creating new banner document...');
            bannerDoc = await Banner.create({
                mobileBanners: [],
                desktopBanners: [],
            });
            console.log('✅ Banner document created:', bannerDoc._id);
        }

        // Determine the field to update
        const field = deviceType === 'mobile' ? 'mobileBanners' : 'desktopBanners';
        const currentBanners = bannerDoc[field as keyof typeof bannerDoc] || [];
        const maxOrder = currentBanners.length > 0
            ? Math.max(...currentBanners.map((b: any) => b.order || 0))
            : -1;

        // Add new banner to the appropriate array
        const newBannerImage = {
            url,
            cloudinaryPublicId,
            order: maxOrder + 1,
        };

        console.log('🎨 Adding new banner:', { field, order: maxOrder + 1 });

        // Add new banner directly to the document
        if (field === 'mobileBanners') {
            bannerDoc.mobileBanners.push(newBannerImage);
        } else {
            bannerDoc.desktopBanners.push(newBannerImage);
        }

        console.log('💾 Saving document to database...');
        const updatedBanners = await bannerDoc.save();

        console.log('✅ Banner saved successfully!');
        console.log('📊 Updated document:', JSON.stringify(updatedBanners.toObject ? updatedBanners.toObject() : updatedBanners));

        return NextResponse.json({
            success: true,
            message: `${deviceType} banner added successfully`,
            data: updatedBanners,
        });
    } catch (error: any) {
        console.error('❌ Error adding banner:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, error: 'Failed to add banner', message: error.message },
            { status: 500 }
        );
    }
}
