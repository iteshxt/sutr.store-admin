'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import { useToast } from '@/components/ToastProvider';

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    
    if (priceRange !== 'all') {
      const total = order.total;
      if (priceRange === '100-500' && (total < 100 || total > 500)) return false;
      if (priceRange === '500-1000' && (total < 500 || total > 1000)) return false;
      if (priceRange === '1000+' && total < 1000) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage and track all customer orders
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white transition-all hover:border-gray-300 w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white transition-all hover:border-gray-300 w-full sm:w-auto"
          >
            <option value="all">All Prices</option>
            <option value="100-500">₹100 — ₹500</option>
            <option value="500-1000">₹500 — ₹1000</option>
            <option value="1000+">₹1000+</option>
          </select>

          <div className="sm:ml-auto text-sm text-gray-600 text-center sm:text-left">
            <span className="font-semibold text-gray-900">{filteredOrders.length}</span> orders found
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Orders List - Desktop Table */}
        <div className="hidden lg:block flex-1 overflow-y-auto min-h-0">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Items</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedOrder?._id === order._id ? 'bg-gray-50' : ''
                  }`}
                >
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden shrink-0 ring-2 ring-gray-100">
                        {order.customerAvatar ? (
                          <Image
                            src={order.customerAvatar}
                            alt={order.customerName || 'Customer'}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-bold">
                            {order.customerName?.charAt(0) || order.customerEmail?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{order.customerName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(order.status)}`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">
                      {order.total !== undefined && !isNaN(Number(order.total)) 
                        ? formatPrice(Number(order.total)) 
                        : '₹0.00'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-12 text-center">
                    <p className="text-gray-500">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Orders List - Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition-all ${
                selectedOrder?._id === order._id ? 'ring-2 ring-black border-black' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {order.customerAvatar ? (
                      <Image
                        src={order.customerAvatar}
                        alt={order.customerName || 'Customer'}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-bold">
                        {(order.customerName || order.customerEmail || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{order.orderNumber}</div>
                    <div className="text-xs text-gray-600 truncate max-w-[150px]">
                      {order.customerName || order.customerEmail}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadgeColor(order.status)}`}>
                  {order.status || 'pending'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                </div>
                <div className="font-bold text-gray-900">
                  {order.total ? formatPrice(order.total) : '₹0.00'}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
          ))}
          
          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>

        {/* Order Details Sidebar */}
        {selectedOrder && (
          <div className="hidden lg:flex w-[420px] h-full bg-white border-l border-gray-200 flex-col shadow-xl overflow-hidden">
            {/* Sidebar Header - Fixed */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadgeColor(selectedOrder.status)}`}>
                      {selectedOrder.status || 'pending'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center">
                    {selectedOrder.customerAvatar ? (
                      <Image
                        src={selectedOrder.customerAvatar}
                        alt={selectedOrder.customerName || 'Customer'}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">
                        {selectedOrder.customerName?.charAt(0) || selectedOrder.customerEmail?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">{selectedOrder.customerName || 'N/A'}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{selectedOrder.customerEmail || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`mailto:${selectedOrder.customerEmail}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                  >
                    <EnvelopeIcon className="w-4 h-4 text-white" />
                    <span className="text-white">Email</span>
                  </a>
                  {selectedOrder.customerPhone && (
                    <a
                      href={`tel:${selectedOrder.customerPhone}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <PhoneIcon className="w-4 h-4 text-white" />
                      <span className="text-white">Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
                        <div className="flex items-start gap-4">
                          {item.image && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-2 ring-gray-100">
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-900 text-base mb-2">
                              {item.name || 'Product Name Not Available'}
                            </h5>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {item.size && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800">
                                  Color: {item.color}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Unit Price: {formatPrice(Number(item.price) || 0)}</span>
                              <span className="text-lg font-bold text-gray-900">{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No items in this order</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Shipping Address</h4>
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <p className="font-semibold text-gray-900 mb-2">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedOrder.shippingAddress.addressLine1}
                    {selectedOrder.shippingAddress.addressLine2 && <>, {selectedOrder.shippingAddress.addressLine2}</>}
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                  </p>
                  <p className="text-sm text-gray-700">{selectedOrder.shippingAddress.country}</p>
                  {selectedOrder.shippingAddress.phone && (
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Phone:</span> {selectedOrder.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Footer - Fixed */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4 shrink-0">
              {/* Order Summary */}
              <div className="space-y-3 mb-4">
                {selectedOrder.subtotal !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                )}
                {selectedOrder.shipping !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">{formatPrice(selectedOrder.shipping)}</span>
                  </div>
                )}
                {selectedOrder.tax !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold text-gray-900">{formatPrice(selectedOrder.tax)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-3 border-t border-gray-300">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Total</span>
                <span className="text-3xl font-bold text-gray-900">
                  {selectedOrder.total !== undefined && !isNaN(Number(selectedOrder.total)) 
                    ? formatPrice(Number(selectedOrder.total)) 
                    : '₹0.00'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-bold text-sm shadow-lg hover:shadow-xl transition-all">
                  Track
                </button>
                <button className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-sm shadow-lg hover:shadow-xl transition-all">
                  Refund
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Order Details Modal */}
        {selectedOrder && (
          <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadgeColor(selectedOrder.status)}`}>
                  {selectedOrder.status || 'pending'}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>

            {/* Mobile Content - Same as desktop but in mobile view */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedOrder.customerAvatar ? (
                      <Image
                        src={selectedOrder.customerAvatar}
                        alt={selectedOrder.customerName || 'Customer'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-bold text-lg">
                        {(selectedOrder.customerName || selectedOrder.customerEmail || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">{selectedOrder.customerName}</p>
                    <p className="text-xs text-gray-600 truncate">{selectedOrder.customerEmail}</p>
                  </div>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg px-3 py-2">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">Shipping Address</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.addressLine1}</p>
                    {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    {selectedOrder.shippingAddress.phone && <p>Phone: {selectedOrder.shippingAddress.phone}</p>}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex gap-3 bg-white rounded-lg p-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {item.price ? formatPrice(item.price) : '₹0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Order Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {selectedOrder.total ? formatPrice(selectedOrder.total) : '₹0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {selectedOrder.total ? formatPrice(selectedOrder.total) : '₹0.00'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pb-4">
                <button className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-bold text-sm">
                  Track
                </button>
                <button className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-sm">
                  Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
