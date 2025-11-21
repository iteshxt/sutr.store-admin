'use client';

import { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { XMarkIcon, ArrowUpTrayIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Banner, BannerImage } from '@/types';
import { useToast } from '@/components/ToastProvider';

interface BannerUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (banners: Banner) => void;
    currentBanners?: Banner | null;
}

type DeviceType = 'mobile' | 'desktop';

interface StagedBanner {
    id: string;
    file: File;
    preview: string;
    deviceType: DeviceType;
}

export default function BannerUploadModal({
    isOpen,
    onClose,
    onSuccess,
    currentBanners,
}: BannerUploadModalProps) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [stagedBanners, setStagedBanners] = useState<StagedBanner[]>([]);
    const [uploading, setUploading] = useState(false);
    const [deviceType, setDeviceType] = useState<DeviceType>('mobile');
    const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0);
    const [desktopCarouselIndex, setDesktopCarouselIndex] = useState(0);
    const [stagedMobileCarouselIndex, setStagedMobileCarouselIndex] = useState(0);
    const [stagedDesktopCarouselIndex, setStagedDesktopCarouselIndex] = useState(0);
    const [stagedDeletions, setStagedDeletions] = useState<{ publicId: string; deviceType: DeviceType }[]>([]);

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
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => handleFileSelect(file));
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const newStagedBanner: StagedBanner = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                preview: reader.result as string,
                deviceType,
            };
            setStagedBanners(prev => [...prev, newStagedBanner]);
            showToast('Image staged for upload', 'success');
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => handleFileSelect(file));
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeStagedBanner = (id: string) => {
        setStagedBanners(prev => prev.filter(banner => banner.id !== id));
        showToast('Image removed from staging', 'info');
    };

    const handleBatchUpload = async () => {
        if (stagedBanners.length === 0 && stagedDeletions.length === 0) {
            showToast('No changes to save', 'error');
            return;
        }

        try {
            setUploading(true);

            // Get auth token
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

            // First, process all staged deletions
            if (stagedDeletions.length > 0) {
                for (const deletion of stagedDeletions) {
                    await handleDeleteBanner(deletion.publicId, deletion.deviceType);
                }
            }

            // Upload all banners to Cloudinary first
            const uploadPromises = stagedBanners.map(async (banner) => {
                const uploadFormData = new FormData();
                uploadFormData.append('file', banner.file);
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
                return {
                    url: uploadData.url,
                    cloudinaryPublicId: uploadData.public_id,
                    deviceType: banner.deviceType,
                };
            });

            const uploadedBanners = await Promise.all(uploadPromises);

            // Now save all banners to database
            const savePromises = uploadedBanners.map(banner =>
                fetch('/api/banners', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        url: banner.url,
                        cloudinaryPublicId: banner.cloudinaryPublicId,
                        deviceType: banner.deviceType,
                    }),
                })
            );

            const saveResponses = await Promise.all(savePromises);

            // Parse all responses and check for errors
            const parsedResponses = [];
            for (let i = 0; i < saveResponses.length; i++) {
                const response = saveResponses[i];
                console.log(`📤 Response ${i + 1} status:`, response.status, response.statusText);
                const data = await response.json();
                console.log(`📤 Response ${i + 1} data:`, data);
                if (!response.ok) {
                    throw new Error(data.error || data.message || 'Failed to save banner');
                }
                parsedResponses.push(data);
            }

            // Get the last response which contains the updated banner data
            const finalData = parsedResponses.length > 0 ? parsedResponses[parsedResponses.length - 1] : null;
            console.log('✅ All banners saved:', finalData);

            const totalChanges = stagedBanners.length + stagedDeletions.length;
            showToast(`${totalChanges} change(s) applied successfully!`, 'success');
            if (finalData?.data) {
                onSuccess(finalData.data);
            }
            setStagedBanners([]);
            setStagedDeletions([]);
        } catch (error: any) {
            console.error('Error updating banners:', error);
            showToast(error.message || 'Failed to update banners', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        // Clear staged changes when closing without updating
        setStagedBanners([]);
        setStagedDeletions([]);
        onClose();
    };

    const isBannerMarkedForDeletion = (publicId: string, deviceType: DeviceType): boolean => {
        return stagedDeletions.some(d => d.publicId === publicId && d.deviceType === deviceType);
    };

    const handleStageDeletion = (publicId: string, type: DeviceType) => {
        setStagedDeletions(prev => [...prev, { publicId, deviceType: type }]);
        showToast('Banner marked for deletion', 'info');
    };

    const handleDeleteBanner = async (publicId: string, type: DeviceType) => {
        try {
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

            if (!currentBanners?._id) {
                showToast('Banner document not found', 'error');
                return;
            }

            const response = await fetch(`/api/banners/${currentBanners._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    deviceType: type,
                    publicId: publicId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete banner');
            }

            const data = await response.json();
            showToast('Banner deleted successfully', 'success');
            onSuccess(data.data);
        } catch (error: any) {
            console.error('Error deleting banner:', error);
            showToast(error.message || 'Failed to delete banner', 'error');
        }
    };


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset staged carousel indices when staged banners change
    useEffect(() => {
        setStagedMobileCarouselIndex(0);
        setStagedDesktopCarouselIndex(0);
    }, [stagedBanners]);

    // Adjust carousel indices if banners are hidden/shown due to staged deletions
    useEffect(() => {
        const allMobileBanners = currentBanners?.mobileBanners || [];
        const visibleMobile = allMobileBanners.filter(b => !isBannerMarkedForDeletion(b.cloudinaryPublicId, 'mobile'));
        if (mobileCarouselIndex >= visibleMobile.length && visibleMobile.length > 0) {
            setMobileCarouselIndex(0);
        }
    }, [stagedDeletions, currentBanners]);

    useEffect(() => {
        const allDesktopBanners = currentBanners?.desktopBanners || [];
        const visibleDesktop = allDesktopBanners.filter(b => !isBannerMarkedForDeletion(b.cloudinaryPublicId, 'desktop'));
        if (desktopCarouselIndex >= visibleDesktop.length && visibleDesktop.length > 0) {
            setDesktopCarouselIndex(0);
        }
    }, [stagedDeletions, currentBanners]);

    if (!isOpen || !mounted) return null;

    const allMobileBanners = currentBanners?.mobileBanners || [];
    const allDesktopBanners = currentBanners?.desktopBanners || [];
    
    // Filter out banners marked for deletion
    const mobileBanners = allMobileBanners.filter(b => !isBannerMarkedForDeletion(b.cloudinaryPublicId, 'mobile'));
    const desktopBanners = allDesktopBanners.filter(b => !isBannerMarkedForDeletion(b.cloudinaryPublicId, 'desktop'));
    
    const currentMobileBanner = mobileBanners[mobileCarouselIndex];
    const currentDesktopBanner = desktopBanners[desktopCarouselIndex];

    // Get staged banners by device type
    const stagedMobileBanners = stagedBanners.filter(b => b.deviceType === 'mobile');
    const stagedDesktopBanners = stagedBanners.filter(b => b.deviceType === 'desktop');

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col" style={{
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.2), 0 -2px 8px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.1), 2px 0 8px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0" style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Manage Banners</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6" style={{
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mobile Banners Section */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900">Mobile Banners ({mobileBanners.length})</h4>
                            {mobileBanners.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-lg border border-gray-200" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
                                        <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden">
                                            <Image
                                                src={currentMobileBanner.url}
                                                alt={`Mobile Banner ${mobileCarouselIndex + 1}`}
                                                fill
                                                className="object-contain p-2"
                                            />
                                            <button
                                                onClick={() => handleStageDeletion(currentMobileBanner.cloudinaryPublicId, 'mobile')}
                                                className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                title="Mark for deletion"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {/* Carousel Controls */}
                                        {mobileBanners.length > 1 && (
                                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                <button
                                                    onClick={() => setMobileCarouselIndex((mobileCarouselIndex - 1 + mobileBanners.length) % mobileBanners.length)}
                                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                                                </button>
                                                <span className="text-sm font-medium text-gray-700">{mobileCarouselIndex + 1}/{mobileBanners.length}</span>
                                                <button
                                                    onClick={() => setMobileCarouselIndex((mobileCarouselIndex + 1) % mobileBanners.length)}
                                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                                                </button>
                                            </div>
                                        )}
                                        {mobileBanners.length === 1 && (
                                            <div className="flex items-center justify-center px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">1/1</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                                    <p className="text-sm text-gray-500">No mobile banners yet</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Banners Section */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900">Desktop Banners ({desktopBanners.length})</h4>
                            {desktopBanners.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-lg border border-gray-200" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
                                        <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden">
                                            <Image
                                                src={currentDesktopBanner.url}
                                                alt={`Desktop Banner ${desktopCarouselIndex + 1}`}
                                                fill
                                                className="object-contain p-2"
                                            />
                                            <button
                                                onClick={() => handleStageDeletion(currentDesktopBanner.cloudinaryPublicId, 'desktop')}
                                                className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                title="Mark for deletion"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {/* Carousel Controls */}
                                        {desktopBanners.length > 1 && (
                                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                <button
                                                    onClick={() => setDesktopCarouselIndex((desktopCarouselIndex - 1 + desktopBanners.length) % desktopBanners.length)}
                                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                                                </button>
                                                <span className="text-sm font-medium text-gray-700">{desktopCarouselIndex + 1}/{desktopBanners.length}</span>
                                                <button
                                                    onClick={() => setDesktopCarouselIndex((desktopCarouselIndex + 1) % desktopBanners.length)}
                                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                                                </button>
                                            </div>
                                        )}
                                        {desktopBanners.length === 1 && (
                                            <div className="flex items-center justify-center px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">1/1</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                                    <p className="text-sm text-gray-500">No desktop banners yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Staged Banners Section */}
                    {stagedBanners.length > 0 && (
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="font-bold text-gray-900 mb-4">Staged for Upload ({stagedBanners.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Staged Mobile Banners */}
                                {stagedMobileBanners.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Mobile ({stagedMobileBanners.length})</p>
                                        <div className="bg-gray-50 rounded-lg border border-gray-200" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
                                            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden">
                                                <Image
                                                    src={stagedMobileBanners[stagedMobileCarouselIndex].preview}
                                                    alt={`Staged mobile banner ${stagedMobileCarouselIndex + 1}`}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                                <button
                                                    onClick={() => removeStagedBanner(stagedMobileBanners[stagedMobileCarouselIndex].id)}
                                                    className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {/* Carousel Controls */}
                                            {stagedMobileBanners.length > 1 && (
                                                <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                    <button
                                                        onClick={() => setStagedMobileCarouselIndex((stagedMobileCarouselIndex - 1 + stagedMobileBanners.length) % stagedMobileBanners.length)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                                                    </button>
                                                    <span className="text-sm font-medium text-gray-700">{stagedMobileCarouselIndex + 1}/{stagedMobileBanners.length}</span>
                                                    <button
                                                        onClick={() => setStagedMobileCarouselIndex((stagedMobileCarouselIndex + 1) % stagedMobileBanners.length)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                                                    </button>
                                                </div>
                                            )}
                                            {stagedMobileBanners.length === 1 && (
                                                <div className="flex items-center justify-center px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                    <span className="text-sm font-medium text-gray-700">1/1</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Staged Desktop Banners */}
                                {stagedDesktopBanners.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Desktop ({stagedDesktopBanners.length})</p>
                                        <div className="bg-gray-50 rounded-lg border border-gray-200" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
                                            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden">
                                                <Image
                                                    src={stagedDesktopBanners[stagedDesktopCarouselIndex].preview}
                                                    alt={`Staged desktop banner ${stagedDesktopCarouselIndex + 1}`}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                                <button
                                                    onClick={() => removeStagedBanner(stagedDesktopBanners[stagedDesktopCarouselIndex].id)}
                                                    className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {/* Carousel Controls */}
                                            {stagedDesktopBanners.length > 1 && (
                                                <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                    <button
                                                        onClick={() => setStagedDesktopCarouselIndex((stagedDesktopCarouselIndex - 1 + stagedDesktopBanners.length) % stagedDesktopBanners.length)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                                                    </button>
                                                    <span className="text-sm font-medium text-gray-700">{stagedDesktopCarouselIndex + 1}/{stagedDesktopBanners.length}</span>
                                                    <button
                                                        onClick={() => setStagedDesktopCarouselIndex((stagedDesktopCarouselIndex + 1) % stagedDesktopBanners.length)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                                                    </button>
                                                </div>
                                            )}
                                            {stagedDesktopBanners.length === 1 && (
                                                <div className="flex items-center justify-center px-3 py-2 bg-gray-100 border-t border-gray-200">
                                                    <span className="text-sm font-medium text-gray-700">1/1</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <h4 className="font-bold text-gray-900 mb-4">Add Banners</h4>

                        {/* Device Type Selection */}
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="deviceType"
                                    value="mobile"
                                    checked={deviceType === 'mobile'}
                                    onChange={() => setDeviceType('mobile')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium text-gray-700">Mobile</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="deviceType"
                                    value="desktop"
                                    checked={deviceType === 'desktop'}
                                    onChange={() => setDeviceType('desktop')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium text-gray-700">Desktop</span>
                            </label>
                        </div>

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
                                multiple
                                onChange={handleInputChange}
                                className="hidden"
                            />

                            <ArrowUpTrayIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                            <p className="text-gray-900 font-bold mb-1 text-sm sm:text-base">Drag and drop your banner images</p>
                            <p className="text-xs sm:text-sm text-gray-600">or click to select files (multiple files allowed)</p>
                            <p className="text-xs text-gray-500 mt-2"> up to 2MB each -- 4000x1800 (Desktop), 800x1200 (Mobile)</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end" style={{
                    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
                }}>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-900 font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleBatchUpload}
                        disabled={uploading || (stagedBanners.length === 0 && stagedDeletions.length === 0)}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined'
        ? ReactDOM.createPortal(modalContent, document.body)
        : null;
}