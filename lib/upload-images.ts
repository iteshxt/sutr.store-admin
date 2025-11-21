import { auth } from './firebase';

export async function uploadImagesToCloudinary(files: File[]): Promise<string[]> {
    if (files.length === 0) return [];

    try {
        // Get Firebase auth token
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to upload images.');
        }

        const token = await user.getIdToken();

        const uploadPromises = files.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            return data.url;
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        throw error;
    }
}
