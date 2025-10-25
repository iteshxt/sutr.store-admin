'use client';

import { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ImageUploadProps {
  images: string[];
  localFiles: File[];
  onImagesChange: (urls: string[]) => void;
  onLocalFilesChange: (files: File[]) => void;
}

export default function ImageUpload({ images, localFiles, onImagesChange, onLocalFilesChange }: ImageUploadProps) {
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

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
  };

  const removeLocalFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(localPreviews[index]);
    
    const newPreviews = localPreviews.filter((_, i) => i !== index);
    const newFiles = localFiles.filter((_, i) => i !== index);
    
    setLocalPreviews(newPreviews);
    onLocalFilesChange(newFiles);
  };

  const totalImages = images.length + localPreviews.length;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <label className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-linear-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-50 transition-all duration-300 hover:border-gray-400">
        <div className="flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 mb-4 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
            <PhotoIcon className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, WEBP up to 10MB
          </p>
          {totalImages > 0 && (
            <div className="mt-3 px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
              {totalImages} {totalImages === 1 ? 'image' : 'images'} selected
            </div>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
        />
      </label>

      {/* Image Previews Grid */}
      {totalImages > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Selected Images</h3>
            <span className="text-xs text-gray-500">{totalImages} total</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Existing uploaded images */}
            {images.map((url, index) => (
              <div key={`existing-${index}`} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
                <Image
                  src={url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg hover:scale-110 transform"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  Uploaded
                </div>
              </div>
            ))}
            
            {/* New local file previews */}
            {localPreviews.map((preview, index) => (
              <div key={`local-${index}`} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-blue-400 bg-white shadow-sm hover:shadow-md transition-all">
                <Image
                  src={preview}
                  alt={`New image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-md">
                  NEW
                </div>
                <button
                  type="button"
                  onClick={() => removeLocalFile(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg hover:scale-110 transform"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-xs font-medium text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  Not uploaded yet
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
