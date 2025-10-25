import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAdminAuth } from '@/lib/auth-admin';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: 'sutr-store/products',
                        transformation: [
                            { width: 1000, height: 1000, crop: 'limit' },
                            { quality: 'auto' },
                            { fetch_format: 'auto' },
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                )
                .end(buffer);
        });

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            message: 'Image uploaded successfully',
        });
    } catch (error: any) {
        console.error('Error uploading image:', error);
        return NextResponse.json(
            { error: 'Failed to upload image', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE endpoint to remove images from Cloudinary
export async function DELETE(request: NextRequest) {
    try {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const publicId = searchParams.get('public_id');

        if (!publicId) {
            return NextResponse.json({ error: 'No public_id provided' }, { status: 400 });
        }

        await cloudinary.uploader.destroy(publicId);

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting image:', error);
        return NextResponse.json(
            { error: 'Failed to delete image', message: error.message },
            { status: 500 }
        );
    }
}
