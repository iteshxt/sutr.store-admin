import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import connectDB from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';

// GET /api/categories - Get all distinct categories from products
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Fetch distinct categories from all products
        const categories = await ProductModel.distinct('category');

        // Filter out empty values and sort alphabetically
        const validCategories = categories
            .filter(cat => cat && cat.trim() !== '')
            .sort((a, b) => a.localeCompare(b));

        return NextResponse.json({
            success: true,
            categories: validCategories,
            count: validCategories.length
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch categories', message: error.message },
            { status: 500 }
        );
    }
}
