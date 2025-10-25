import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
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
        const role = searchParams.get('role');
        const limit = parseInt(searchParams.get('limit') || '100');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Build query
        const query: any = {};
        if (role && role !== 'all') {
            query.role = role;
        }

        // Fetch users with pagination and sorting
        const users = await User.find(query)
            .select('-firebaseUid') // Exclude sensitive fields
            .sort({ createdAt: -1 }) // Most recent first
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await User.countDocuments(query);

        return NextResponse.json({
            success: true,
            users,
            total,
            limit,
            skip,
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users', message: error.message },
            { status: 500 }
        );
    }
}
