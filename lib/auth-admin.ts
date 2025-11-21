import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Check if user has admin claim
        return decodedToken.admin === true;
    } catch (error) {
        return false;
    }
}

export async function verifyAdminToken(token: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Check if user has admin claim
        if (decodedToken.admin !== true) {
            return null;
        }

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            admin: true,
        };
    } catch (error) {
        return null;
    }
}

export async function getAuthUser(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            admin: decodedToken.admin === true,
        };
    } catch (error) {
        return null;
    }
}
