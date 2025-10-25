import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// GET current admin profile
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminUser = await verifyAdminToken(token);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        await dbConnect();

        // Fetch the admin user from database
        const profile = await User.findOne({ firebaseUid: adminUser.uid })
            .select('-__v')
            .lean();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            profile: {
                _id: profile._id?.toString(),
                firebaseUid: profile.firebaseUid,
                email: profile.email,
                name: profile.name,
                phone: profile.phone,
                avatar: profile.avatar,
                role: profile.role,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
            },
        });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH update admin profile
export async function PATCH(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminUser = await verifyAdminToken(token);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { name, phone } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        await dbConnect();

        // Update the admin user profile
        const updatedProfile = await User.findOneAndUpdate(
            { firebaseUid: adminUser.uid },
            {
                $set: {
                    name: name.trim(),
                    phone: phone?.trim() || undefined,
                },
            },
            { new: true, runValidators: true }
        )
            .select('-__v')
            .lean();

        if (!updatedProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            profile: {
                _id: updatedProfile._id?.toString(),
                firebaseUid: updatedProfile.firebaseUid,
                email: updatedProfile.email,
                name: updatedProfile.name,
                phone: updatedProfile.phone,
                avatar: updatedProfile.avatar,
                role: updatedProfile.role,
                createdAt: updatedProfile.createdAt,
                updatedAt: updatedProfile.updatedAt,
            },
        });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile', details: error.message },
            { status: 500 }
        );
    }
}
