import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import clientPromise from '@/lib/mongodb';
import User from '@/lib/models/User';

// DELETE user - removes from both MongoDB and Firebase
export async function DELETE(
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

        // Get user to find their Firebase UID
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete from Firebase first
        if (user.firebaseUid) {
            try {
                const admin = (await import('firebase-admin')).default;
                await admin.auth().deleteUser(user.firebaseUid);
            } catch (firebaseError: any) {
                // Continue with MongoDB deletion even if Firebase fails
            }
        }

        // Delete from MongoDB
        await User.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to delete user', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH user - update user details (role, status, etc.)
export async function PATCH(
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
        const body = await request.json();

        // Connect to MongoDB
        await clientPromise;

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: updatedUser
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to update user', details: error.message },
            { status: 500 }
        );
    }
}
