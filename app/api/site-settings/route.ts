import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import connectDB from '@/lib/mongodb';
import { SiteSettings } from '@/lib/models/SiteSettings';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        let settings = await SiteSettings.findOne();

        if (!settings) {
            settings = await SiteSettings.create({ maintenance: false });
        }

        return NextResponse.json({
            success: true,
            settings: {
                maintenance: settings.maintenance,
            },
        });
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch site settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const { maintenance } = await request.json();

        if (typeof maintenance !== 'boolean') {
            return NextResponse.json(
                { success: false, message: 'Invalid maintenance value' },
                { status: 400 }
            );
        }

        let settings = await SiteSettings.findOne();

        if (!settings) {
            settings = await SiteSettings.create({ maintenance });
        } else {
            settings.maintenance = maintenance;
            await settings.save();
        }

        return NextResponse.json({
            success: true,
            message: `Maintenance mode ${maintenance ? 'enabled' : 'disabled'}`,
            settings: {
                maintenance: settings.maintenance,
            },
        });
    } catch (error) {
        console.error('Error updating site settings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update site settings' },
            { status: 500 }
        );
    }
}
