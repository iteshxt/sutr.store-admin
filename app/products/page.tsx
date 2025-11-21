'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatPrice, getStatusColor } from '@/lib/utils';
import { Product, Banner } from '@/types';
import BannerUploadModal from '@/components/BannerUploadModal';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all']);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCurrentBanner();
  }, [filterCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(['all', ...data.categories]);
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filterCategory && filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get auth token function
  const getAuthToken = async () => {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return '';
  };

  const fetchCurrentBanner = async () => {
    try {
      const response = await fetch('/api/banners');
      if (response.ok) {
        const data = await response.json();
        setCurrentBanner(data.data);
      }
    } catch (error) {
      console.error('Error fetching banner:', error);
    }
  };

  // Delete product function
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove product from local state
        setProducts(products.filter(p => p.id !== productId));
      } else {
        throw new Error(data.error || 'Failed to delete product');
      }
      
    } catch (error) {
      alert('Failed to delete product. Please try again.');
    }
  };

  // Helper function to check if product has any stock
  const hasAnyStock = (product: Product) => {
    if (Array.isArray(product.inStock)) {
      return product.inStock.some(inStock => inStock === true);
    }
    return product.inStock === true;
  };

  // Helper function to get total stock
  const getTotalStock = (product: Product) => {
    if (Array.isArray(product.stock)) {
      return product.stock.reduce((sum, stock) => sum + (stock || 0), 0);
    }
    return product.stock || 0;
  };

  // Since filtering is now done server-side, we can use products directly
  const filteredProducts = products
    .filter((product) => {
      // Client-side search
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Client-side status filter - handle both boolean and array
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'instock' && hasAnyStock(product)) ||
        (filterStatus === 'outofstock' && !hasAnyStock(product));
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.salePrice || a.price) - (b.salePrice || b.price);
        case 'price-high':
          return (b.salePrice || b.price) - (a.salePrice || a.price);
        case 'stock-low':
          return getTotalStock(a) - getTotalStock(b);
        case 'stock-high':
          return getTotalStock(b) - getTotalStock(a);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage your product catalog · {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm whitespace-nowrap cursor-pointer"
            >
              <PlusIcon className="h-5 w-5 text-white" />
              <span>Update Banner</span>
            </button>
            <Link
              href="/products/new"
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 sm:px-5 py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors font-medium text-sm whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5 text-white" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 font-medium"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 font-medium"
            >
              <option value="all">All Status</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 font-medium w-full sm:w-auto"
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="stock-low">Stock: Low to High</option>
            <option value="stock-high">Stock: High to Low</option>
          </select>
        </div>
      </div>

      {/* Table Content - Desktop */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 hidden md:block">
        {filteredProducts.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                <th className="px-4 lg:px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <Image
                          src={product.images[0] || '/placeholder.png'}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          {product.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ Featured
                            </span>
                          )}
                          {product.newArrival && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ✨ New Arrival
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-sm text-gray-600 capitalize">{product.category}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {Array.isArray(product.inStock) && Array.isArray(product.sizes) && product.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {product.sizes.map((size, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              product.inStock?.[idx]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          hasAnyStock(product)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {hasAnyStock(product) ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.salePrice || product.price)}
                      </span>
                      {product.salePrice && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {Array.isArray(product.stock) && Array.isArray(product.sizes) && product.sizes.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {product.sizes.map((size, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs border border-gray-200">
                              <span className="font-medium text-gray-700">{size}:</span>
                              <span className={`font-semibold ${
                                (product.stock?.[idx] || 0) < 5 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {product.stock?.[idx] || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          Total: <span className="font-semibold text-gray-900">{getTotalStock(product)}</span>
                        </span>
                      </div>
                    ) : (
                      <span className={`text-sm font-medium ${getTotalStock(product) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {getTotalStock(product)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white! bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="text-white!">Edit</span>
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id!)}
                        className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-white hover:bg-red-600 border border-gray-300 hover:border-red-600 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-sm">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first product.'}
              </p>
              {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
                <Link
                  href="/products/new"
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  <PlusIcon className="h-5 w-5 text-white" />
                  <span className="text-white">Add Product</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="flex-1 overflow-auto px-4 py-4 md:hidden">
        {filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <Image
                      src={product.images[0] || '/placeholder.png'}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 capitalize mb-2">{product.category}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Array.isArray(product.inStock) && Array.isArray(product.sizes) && product.sizes.length > 0 ? (
                        product.sizes.map((size, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              product.inStock?.[idx]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {size}
                          </span>
                        ))
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          hasAnyStock(product) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {hasAnyStock(product) ? 'In Stock' : 'Out of Stock'}
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        {product.featured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⭐ Featured
                          </span>
                        )}
                        {product.newArrival && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✨ New Arrival
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(product.salePrice || product.price)}
                    </div>
                    {product.salePrice && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </div>
                    )}
                    {Array.isArray(product.stock) && Array.isArray(product.sizes) && product.sizes.length > 0 ? (
                      <div className="mt-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {product.sizes.map((size, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-xs border border-gray-200">
                              <span className="font-medium text-gray-700">{size}:</span>
                              <span className={`font-semibold ${
                                (product.stock?.[idx] || 0) < 5 ? 'text-red-600' : 'text-gray-900'
                              }`}>{product.stock?.[idx] || 0}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1.5">
                          Total: <span className="font-semibold text-gray-900">{getTotalStock(product)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 mt-1">
                        Stock: <span className={getTotalStock(product) < 10 ? 'text-red-600 font-medium' : 'font-medium'}>{getTotalStock(product)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="inline-flex items-center justify-center p-2 text-white! bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-5 w-5 text-white!" />
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id!)}
                      className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-white hover:bg-red-600 border border-gray-300 hover:border-red-600 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first product.'}
              </p>
              {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
                <Link
                  href="/products/new"
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  <PlusIcon className="h-5 w-5 text-white" />
                  <span className="text-white">Add Product</span>
                </Link>
              )}
            </div>
          </div>
        )}

      {/* Banner Upload Modal */}
      <BannerUploadModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        onSuccess={(banner) => {
          setCurrentBanner(banner);
        }}
        currentBanners={currentBanner}
      />
      </div>
    </div>
  );
}
