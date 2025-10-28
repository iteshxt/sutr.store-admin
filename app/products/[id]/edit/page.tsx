'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import { uploadImagesToCloudinary } from '@/lib/upload-images';
import { useToast } from '@/components/ToastProvider';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    stock: [] as number[],
    sizes: [] as string[],
    colors: [] as string[],
    images: [] as string[],
    inStock: [] as boolean[],
    featured: false,
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
      } catch {
        // Silent fail
      }
    };

    fetchCategories();
  }, []);

  // Resolve params and fetch product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        
        // Validate ID before setting and fetching
        if (!id || id === 'undefined') {
          showToast('Invalid product ID', 'error');
          router.push('/products');
          return;
        }
        
        setProductId(id);
        
        // Get auth token
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

        const response = await fetch(`/api/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        
        if (data.success && data.product) {
          const product = data.product;
          
          // Handle stock - convert to array if it's a number
          let stockArray: number[] = [];
          if (Array.isArray(product.stock)) {
            stockArray = product.stock;
          } else if (typeof product.stock === 'number') {
            // If stock is a single number, distribute it evenly across sizes
            const stockPerSize = Math.floor(product.stock / (product.sizes?.length || 1));
            stockArray = new Array(product.sizes?.length || 0).fill(stockPerSize);
          }
          
          // Handle inStock - convert to array if it's a boolean
          let inStockArray: boolean[] = [];
          if (Array.isArray(product.inStock)) {
            inStockArray = product.inStock;
          } else if (typeof product.inStock === 'boolean') {
            // If inStock is a single boolean, apply to all sizes
            inStockArray = new Array(product.sizes?.length || 0).fill(product.inStock);
          } else {
            // Calculate based on stock values
            inStockArray = stockArray.map(stock => stock > 0);
          }
          
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            salePrice: product.salePrice?.toString() || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            tags: product.tags || [],
            stock: stockArray,
            sizes: product.sizes || [],
            colors: product.colors || [],
            images: product.images || [],
            inStock: inStockArray,
            featured: product.featured ?? false,
            // Product Details
            productDetails: {
              color: product.productDetails?.color || '',
              fit: product.productDetails?.fit || '',
              fabric: product.productDetails?.fabric || '',
              neck: product.productDetails?.neck || '',
            },
          });
          // Initialize input strings for tags, colors, and stock
          setTagsInput(product.tags ? product.tags.join(', ') : '');
          setColorsInput(product.colors ? product.colors.join(', ') : '');
          setStockInput(stockArray.length > 0 ? stockArray.join(',') : '');
        } else {
          throw new Error('Product not found');
        }
      } catch {
        showToast('Failed to load product', 'error');
        router.push('/products');
      }
    };

    loadProduct();
  }, [params, router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate that stock array matches sizes array
      if (formData.stock.length > 0 && formData.stock.length !== formData.sizes.length) {
        throw new Error(`Stock quantities (${formData.stock.length}) must match the number of selected sizes (${formData.sizes.length})`);
      }

      // Upload new local files to Cloudinary first
      let newImageUrls: string[] = [];
      if (localFiles.length > 0) {
        try {
          newImageUrls = await uploadImagesToCloudinary(localFiles);
        } catch {
          throw new Error('Failed to upload images. Please try again.');
        }
      }

      // Combine existing images with newly uploaded ones
      const allImages = [...formData.images, ...newImageUrls];

      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          images: allImages,
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
          stock: formData.stock,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      if (data.success) {
        showToast('Product updated successfully!', 'success');
        router.push('/products');
      } else {
        throw new Error(data.error || 'Failed to update product');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update product', 'error');
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

  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [section, field] = name.split('.');
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as Record<string, unknown>),
          [field]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as Record<string, unknown>),
          [field]: value
        }
      }));
    }
  };

  const handleArrayChange = (field: 'sizes' | 'colors' | 'tags', value: string) => {
    // Update the input string state
    if (field === 'tags') {
      setTagsInput(value);
    } else if (field === 'colors') {
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

  const toggleFeature = (feature: 'featured') => {
    setFormData((prev) => ({
      ...prev,
      [feature]: !prev[feature]
    }));
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Update product information
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
          
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
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
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    list="categories-list"
                    required
                    style={{ backgroundImage: 'none' }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all [&::-webkit-calendar-picker-indicator]:hidden"
                    placeholder="Enter or select category"
                  />
                  <datalist id="categories-list">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="subcategory" className="block text-sm font-semibold text-gray-900 mb-2">
                    Subcategory <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="e.g., Casual, Premium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-900 mb-2">
                  Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => handleArrayChange('tags', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  placeholder="e.g., trendy, comfortable, casual"
                />
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

          {/* Pricing Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Stock</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-900 mb-2">
                  Regular Price (₹)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
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
                  value={formData.salePrice}
                  onChange={handleChange}
                  step="1"
                  min="0"
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
                    ? `Enter ${formData.sizes.length} values (one for each size: ${formData.sizes.join(', ')})`
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
              These details will appear in the &quot;Additional Information&quot; tab on the product page
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="productDetails.color" className="block text-sm font-semibold text-gray-900 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  id="productDetails.color"
                  name="productDetails.color"
                  value={formData.productDetails?.color || ''}
                  onChange={handleNestedChange}
                  placeholder="e.g., White, Black"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div>
                <label htmlFor="productDetails.fit" className="block text-sm font-semibold text-gray-900 mb-2">
                  Fit
                </label>
                <input
                  type="text"
                  id="productDetails.fit"
                  name="productDetails.fit"
                  value={formData.productDetails?.fit || ''}
                  onChange={handleNestedChange}
                  placeholder="e.g., Oversized"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div>
                <label htmlFor="productDetails.fabric" className="block text-sm font-semibold text-gray-900 mb-2">
                  Fabric
                </label>
                <input
                  type="text"
                  id="productDetails.fabric"
                  name="productDetails.fabric"
                  value={formData.productDetails?.fabric || ''}
                  onChange={handleNestedChange}
                  placeholder="e.g., 100% Cotton"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>

              <div>
                <label htmlFor="productDetails.neck" className="block text-sm font-semibold text-gray-900 mb-2">
                  Neck
                </label>
                <input
                  type="text"
                  id="productDetails.neck"
                  name="productDetails.neck"
                  value={formData.productDetails?.neck || ''}
                  onChange={handleNestedChange}
                  placeholder="e.g., Round Neck"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong className="font-semibold">Note:</strong> Wash instructions (e.g., &quot;Machine Wash Cold&quot;) and care instructions are hardcoded in the frontend and same for all products.
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {/* Stock Status - Auto-calculated */}
              <div className="p-4 rounded-xl border border-gray-200 bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Stock Status</p>
                    <p className="text-xs text-gray-600">Auto-calculated per size based on stock quantity</p>
                  </div>
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.featured ? 'bg-yellow-100' : 'bg-gray-200'}`}>
                    <svg className={`w-5 h-5 ${formData.featured ? 'text-yellow-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="featured" className="block text-sm font-semibold text-gray-900">
                      Featured
                    </label>
                    <p className="text-xs text-gray-500">Show in featured section</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFeature('featured')}
                  className={`
                    relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                    ${formData.featured ? 'bg-black' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md
                      ${formData.featured ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
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
              <span className="text-white!">{loading ? 'Updating Product...' : 'Update Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}