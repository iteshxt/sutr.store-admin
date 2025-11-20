'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, EnvelopeIcon, PhoneIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import { useToast } from '@/components/ToastProvider';
import OrderDetailsModal from '@/components/OrderDetailsModal';

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [updatingOrder, setUpdatingOrder] = useState(false);

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
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out for delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
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
            <option value="shipped">Shipped</option>
            <option value="out for delivery">Out for Delivery</option>
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

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onEdit={async (updatedOrder) => {
            try {
              setUpdatingOrder(true);
              const { getAuth } = await import('firebase/auth');
              const auth = getAuth();
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

              const response = await fetch(`/api/orders/${updatedOrder._id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  status: updatedOrder.status,
                  trackingNumber: updatedOrder.trackingNumber || undefined,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update order');
              }

              const data = await response.json();
              const updatedOrderData = { ...selectedOrder, ...data.order };

              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order._id === updatedOrder._id ? updatedOrderData : order
                )
              );

              setSelectedOrder(updatedOrderData);
              showToast('Order updated successfully', 'success');
            } catch (error: any) {
              console.error('Error updating order:', error);
              showToast(error.message || 'Failed to update order', 'error');
            } finally {
              setUpdatingOrder(false);
            }
          }}
          getStatusBadgeColor={getStatusBadgeColor}
        />
      </div>
    </div>
  );
}