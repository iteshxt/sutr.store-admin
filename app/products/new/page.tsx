'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import { uploadImagesToCloudinary } from '@/lib/upload-images';
import { useToast } from '@/components/ToastProvider';

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [colorsInput, setColorsInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    category: '',
    subcategory: '',
    stock: [] as number[],
    sizes: [] as string[],
    colors: [] as string[],
    images: [] as string[],
    inStock: [] as boolean[],
    featured: false,
    newArrival: false,
    // Product Details (for Additional Information tab)
    productDetails: {
      color: '',        // Dynamic - e.g., "White", "Black"
      fit: '',          // Dynamic - e.g., "Oversized"
      fabric: '',       // Dynamic - e.g., "100% Cotton"
      neck: '',         // Dynamic - e.g., "Round Neck"
    },
  });

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

        const response = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.categories) {
            setCategories(data.categories);
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate that stock array matches sizes array
      if (formData.stock.length > 0 && formData.stock.length !== formData.sizes.length) {
        throw new Error(`Stock quantities (${formData.stock.length}) must match the number of selected sizes (${formData.sizes.length})`);
      }

      // Upload new local files to Cloudinary first
      let imageUrls: string[] = [];
      if (localFiles.length > 0) {
        try {
          imageUrls = await uploadImagesToCloudinary(localFiles);
        } catch (uploadError) {
          throw new Error('Failed to upload images. Please try again.');
        }
      }

      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const requestBody = {
        ...formData,
        images: imageUrls,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        stock: formData.stock,
      };
      

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      if (data.success) {
        showToast('Product created successfully!', 'success');
        router.push('/products');
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNestedChange = (section: 'productDetails', field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (field: 'sizes' | 'colors', value: string) => {
    // Update the input string state
    if (field === 'colors') {
      setColorsInput(value);
    }
    
    // Update the formData array
    setFormData((prev) => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean),
    }));
  };

  const handleStockChange = (value: string) => {
    setStockInput(value);
    
    // Convert comma-separated string to array of numbers
    const stockArray = value
      .split(',')
      .map(item => {
        const num = parseInt(item.trim());
        return isNaN(num) ? 0 : num;
      })
      .filter((_, index) => index < formData.sizes.length); // Only take as many as there are sizes
    
    // Automatically calculate inStock array based on stock values
    const inStockArray = stockArray.map(stock => stock > 0);
    
    setFormData((prev) => ({
      ...prev,
      stock: stockArray,
      inStock: inStockArray,
    }));
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleToggleFeatured = () => {
    setFormData((prev) => {
      const newFeaturedValue = !prev.featured;
      return {
        ...prev,
        featured: newFeaturedValue,
        newArrival: newFeaturedValue ? false : prev.newArrival, // If turning featured ON, turn newArrival OFF
      };
    });
  };

  const handleToggleNewArrival = () => {
    setFormData((prev) => {
      const newNewArrivalValue = !prev.newArrival;
      return {
        ...prev,
        newArrival: newNewArrivalValue,
        featured: newNewArrivalValue ? false : prev.featured, // If turning newArrival ON, turn featured OFF
      };
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/products"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Create a new product in your catalog
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="max-w-7xl">
          {/* Top Section: Basic Info + Image Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Basic Info (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      list="categories-list"
                      style={{ backgroundImage: 'none' }}
                      placeholder="Enter or select category"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                    <datalist id="categories-list">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor="subcategory" className="block text-sm font-semibold text-gray-900 mb-2">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      id="subcategory"
                      name="subcategory"
                      required
                      value={formData.subcategory}
                      onChange={handleChange}
                      placeholder="e.g., Casual, Premium"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Right: Image Upload (1 column) */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Images</h2>
              <ImageUpload 
                images={formData.images || []}
                localFiles={localFiles}
                onImagesChange={(urls: string[]) => setFormData(prev => ({ ...prev, images: urls }))}
                onLocalFilesChange={setLocalFiles}
              />
            </div>
          </div>

          {/* Pricing & Stock Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Stock</h2>
          
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-900 mb-2">
                  Regular Price (₹)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="salePrice" className="block text-sm font-semibold text-gray-900 mb-2">
                  Sale Price (₹)
                </label>
                <input
                  type="number"
                  id="salePrice"
                  name="salePrice"
                  min="0"
                  step="1"
                  value={formData.salePrice}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-semibold text-gray-900 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="text"
                  id="stock"
                  name="stock"
                  value={stockInput}
                  onChange={(e) => handleStockChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  placeholder="e.g., 12,14,15"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.sizes.length > 0 
                    ? `Enter ${formData.sizes.length} values (one for each size: ${formData.sizes.join(',')})`
                    : 'Select sizes first, then enter stock for each size (comma-separated)'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Variants</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sizes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`
                        w-12 h-12 rounded-full font-semibold text-sm transition-all
                        ${formData.sizes.includes(size)
                          ? 'bg-black text-white shadow-lg shadow-black/20 scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label htmlFor="colors" className="block text-sm font-semibold text-gray-900 mb-2">
                  Available Colors
                </label>
                <input
                  type="text"
                  id="colors"
                  value={colorsInput}
                  onChange={(e) => handleArrayChange('colors', e.target.value)}
                  placeholder="Black, White, Navy, Red"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Separate multiple colors with commas</p>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Details</h2>
            <p className="text-sm text-gray-500 mb-6">
              These details will appear in the "Additional Information" tab on the product page
            </p>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="productColor" className="block text-sm font-semibold text-gray-900 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  id="productColor"
                  value={formData.productDetails.color}
                  onChange={(e) => handleNestedChange('productDetails', 'color', e.target.value)}
                  placeholder="e.g., White, Black"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div>
                <label htmlFor="fit" className="block text-sm font-semibold text-gray-900 mb-2">
                  Fit
                </label>
                <input
                  type="text"
                  id="fit"
                  value={formData.productDetails.fit}
                  onChange={(e) => handleNestedChange('productDetails', 'fit', e.target.value)}
                  placeholder="e.g., Oversized"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div>
                <label htmlFor="fabric" className="block text-sm font-semibold text-gray-900 mb-2">
                  Fabric
                </label>
                <input
                  type="text"
                  id="fabric"
                  value={formData.productDetails.fabric}
                  onChange={(e) => handleNestedChange('productDetails', 'fabric', e.target.value)}
                  placeholder="e.g., 100% Cotton"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div>
                <label htmlFor="neck" className="block text-sm font-semibold text-gray-900 mb-2">
                  Neck
                </label>
                <input
                  type="text"
                  id="neck"
                  value={formData.productDetails.neck}
                  onChange={(e) => handleNestedChange('productDetails', 'neck', e.target.value)}
                  placeholder="e.g., Round Neck"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong className="font-semibold">Note:</strong> Wash instructions (e.g., "Machine Wash Cold") and care instructions are hardcoded in the frontend and same for all products.
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {/* Product Status */}
              <div className="flex gap-4 items-center">
                {/* Featured */}
                <button
                  type="button"
                  onClick={(e) => {
                    handleToggleFeatured();
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 border-2 ${
                    formData.featured
                      ? 'bg-yellow-400 text-white border-yellow-500 shadow-md shadow-yellow-300/40'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}>
                  <svg className="w-5 h-5 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Featured</span>
                </button>

                {/* New Arrival */}
                <button
                  type="button"
                  onClick={(e) => {
                    handleToggleNewArrival();
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 border-2 ${
                    formData.newArrival
                      ? 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-300/40'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}>
                  <svg className="w-5 h-5 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>New Arrival</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
            <Link
              href="/products"
              className="px-8 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-black! hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-black text-white! text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
            >
              <span className="text-white!">{loading ? 'Creating Product...' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
