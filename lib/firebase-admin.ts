import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App;

if (!getApps().length) {
    app = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
} else {
    app = getApps()[0];
}

const adminAuth = getAuth(app);

export { app, adminAuth };

// Helper function to verify admin role
export async function verifyAdmin(token: string): Promise<boolean> {
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken.admin === true;
    } catch (error) {
        return false;
    }
}

// Helper function to set admin claim
export async function setAdminClaim(uid: string): Promise<void> {
    try {
        await adminAuth.setCustomUserClaims(uid, { admin: true });
    } catch (error) {
        throw error;
    }
}

// Helper function to remove admin claim
export async function removeAdminClaim(uid: string): Promise<void> {
    try {
        await adminAuth.setCustomUserClaims(uid, { admin: false });
    } catch (error) {
        throw error;
    }
}
