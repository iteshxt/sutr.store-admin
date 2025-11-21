'use client';

import { useState } from 'react';
import { XMarkIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ImageUploadProps {
  images: string[];
  localFiles: File[];
  onImagesChange: (urls: string[]) => void;
  onLocalFilesChange: (files: File[]) => void;
}

export default function ImageUpload({ images, localFiles, onImagesChange, onLocalFilesChange }: ImageUploadProps) {
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fileInputRef = useState<HTMLInputElement | null>(null)[1];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create local preview URLs
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    setLocalPreviews([...localPreviews, ...newPreviews]);
    onLocalFilesChange([...localFiles, ...newFiles]);
  };

  const removeExistingImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Adjust carousel index if needed
    const totalImages = newImages.length + localPreviews.length;
    if (carouselIndex >= totalImages && carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  const removeLocalFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(localPreviews[index]);
    
    const newPreviews = localPreviews.filter((_, i) => i !== index);
    const newFiles = localFiles.filter((_, i) => i !== index);
    
    setLocalPreviews(newPreviews);
    onLocalFilesChange(newFiles);
    
    // Adjust carousel index if needed
    const totalImages = images.length + newPreviews.length;
    if (carouselIndex >= totalImages && carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  const totalImages = images.length + localPreviews.length;
  
  // Get current image to display
  const getCurrentImage = () => {
    if (carouselIndex < images.length) {
      return { url: images[carouselIndex], type: 'uploaded' as const };
    } else {
      return { url: localPreviews[carouselIndex - images.length], type: 'new' as const };
    }
  };

  const handlePrevious = () => {
    setCarouselIndex((carouselIndex - 1 + totalImages) % totalImages);
  };

  const handleNext = () => {
    setCarouselIndex((carouselIndex + 1) % totalImages);
  };

  return (
    <div className="space-y-4">
      {/* Carousel View with Thumbnails on Right */}
      {totalImages > 0 && (
        <div className={`flex gap-4 ${totalImages === 1 ? 'justify-center' : ''}`}>
          {/* Main Carousel Display - Left Side */}
          <div className="w-1/2 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex flex-col" style={{ aspectRatio: '3/4' }}>
            {/* Image Display */}
            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden bg-white">
              <Image
                src={getCurrentImage().url}
                alt={`Product image ${carouselIndex + 1}`}
                fill
                className="object-contain p-4"
                priority
              />
              {/* Status Badge */}
              <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold shadow-md ${
                getCurrentImage().type === 'uploaded'
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                {getCurrentImage().type === 'uploaded' ? 'UPLOADED' : 'NEW'}
              </div>
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => {
                  if (getCurrentImage().type === 'uploaded') {
                    removeExistingImage(carouselIndex);
                  } else {
                    removeLocalFile(carouselIndex - images.length);
                  }
                }}
                className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:scale-110 transform"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Carousel Controls */}
            {totalImages > 1 && (
              <div className="flex items-center justify-between px-3 py-3 bg-gray-100 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {carouselIndex + 1} / {totalImages}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
            {totalImages === 1 && (
              <div className="flex items-center justify-center px-3 py-3 bg-gray-100 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">1 / 1</span>
              </div>
            )}
          </div>

          {/* Thumbnails Grid - Right Side */}
          {totalImages > 1 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-gray-900">All Images ({totalImages})</div>
              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(3 * 64px + 16px)' }}>
                {/* Uploaded images */}
                {images.map((url, index) => (
                  <button
                    key={`uploaded-${index}`}
                    type="button"
                    onClick={() => setCarouselIndex(index)}
                    className={`group relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                      carouselIndex === index
                        ? 'border-black shadow-lg'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  </button>
                ))}
                
                {/* New images */}
                {localPreviews.map((preview, index) => (
                  <button
                    key={`new-${index}`}
                    type="button"
                    onClick={() => setCarouselIndex(images.length + index)}
                    className={`group relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                      carouselIndex === images.length + index
                        ? 'border-blue-600 shadow-lg'
                        : 'border-blue-300 hover:border-blue-400'
                    }`}
                  >
                    <Image
                      src={preview}
                      alt={`New thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <div className="absolute top-0.5 left-0.5 px-1 py-0 bg-blue-500 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      N
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simple Upload Button */}
      <button
        type="button"
        onClick={() => {
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          input?.click();
        }}
        className="w-full px-4 py-2.5 border border-black bg-black hover:bg-gray-900 text-white rounded-lg transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
      >
        <PhotoIcon className="w-4 h-4" />
        <span>
          {totalImages > 0 ? `${totalImages} image${totalImages === 1 ? '' : 's'} selected` : 'Select Images'}
        </span>
      </button>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        ref={(input) => {
          if (input) {
            const ref = document.querySelector('input[type="file"]') as HTMLInputElement;
          }
        }}
      />
    </div>
  );
}
