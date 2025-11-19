'use client';

import { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Banner } from '@/types';
import { useToast } from '@/components/ToastProvider';

interface BannerUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (banner: Banner) => void;
    currentBanner?: Banner | null;
}

export default function BannerUploadModal({
    isOpen,
    onClose,
    onSuccess,
    currentBanner,
}: BannerUploadModalProps) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('Website Banner');
    const [link, setLink] = useState('');

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showToast('Please select an image first', 'error');
            return;
        }

        try {
            setUploading(true);

            // Get auth token first
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

            // Upload to backend API (which uses Cloudinary)
            const uploadFormData = new FormData();
            uploadFormData.append('file', selectedFile);
            uploadFormData.append('folder', 'sutr-store/banners');

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || errorData.error || 'Failed to upload image');
            }

            const uploadData = await uploadResponse.json();
            const bannerUrl = uploadData.url;
            const publicId = uploadData.public_id;

            // Save banner to database
            const response = await fetch('/api/banners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bannerUrl,
                    cloudinaryPublicId: publicId,
                    title: 'Website Banner',
                    link: null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save banner');
            }

            const data = await response.json();

            showToast('Banner uploaded successfully!', 'success');
            onSuccess(data.banner);
            resetForm();
            onClose();
        } catch (error: any) {
            console.error('Error uploading banner:', error);
            showToast(error.message || 'Failed to upload banner', 'error');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreview('');
        setTitle('Website Banner');
        setLink('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col" style={{
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.2), 0 -2px 8px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.1), 2px 0 8px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0" style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Update Website Banner</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.3) transparent'
                }}>
                    <style>{`
                        div::-webkit-scrollbar {
                            width: 6px;
                        }
                        div::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        div::-webkit-scrollbar-thumb {
                            background: rgba(0,0,0,0.3);
                            border-radius: 3px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                            background: rgba(0,0,0,0.5);
                        }
                    `}</style>
                    {/* Current Banner Preview */}
                    {currentBanner && (
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">Current Banner</label>
                            <div className="flex justify-center bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-4">
                                <div className="relative w-full max-w-md" style={{ aspectRatio: '16/9' }}>
                                    <Image
                                        src={currentBanner.bannerUrl}
                                        alt="Current Banner"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Drag & Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all cursor-pointer ${
                            isDragging
                                ? 'border-black bg-black/5'
                                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        <ArrowUpTrayIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                        <p className="text-gray-900 font-bold mb-1 text-sm sm:text-base">Drag and drop your banner image</p>
                        <p className="text-xs sm:text-sm text-gray-600">or click to select a file</p>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">Preview</label>
                            <div className="flex justify-center bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-4">
                                <div className="relative w-full max-w-xl" style={{ aspectRatio: '16/9' }}>
                                    <Image
                                        src={preview}
                                        alt="Preview"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end" style={{
                    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
                }}>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-900 font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                            </>
                        ) : (
                            'Upload Banner'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    
    return ReactDOM.createPortal(modalContent, document.body);
}
