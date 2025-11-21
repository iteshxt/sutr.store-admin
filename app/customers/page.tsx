'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MagnifyingGlassIcon, EnvelopeIcon, PhoneIcon, ShoppingBagIcon, XMarkIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatDate, formatPrice } from '@/lib/utils';
import { User, Order } from '@/types';
import { useToast } from '@/components/ToastProvider';

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer && selectedCustomer._id) {
      fetchUserOrders(selectedCustomer._id);
    } else {
      setUserOrders([]);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      
      if (data.success && data.users) {
        setCustomers(data.users);
      }
    } catch (error) {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async (userId: string) => {
    try {
      setLoadingOrders(true);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch(`/api/users/${userId}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setUserOrders(data.orders || []);
    } catch (error) {
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedCustomer) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedCustomer.name || selectedCustomer.email}? This will permanently remove the user from both the database and authentication system.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingUser(true);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch(`/api/users/${selectedCustomer._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      showToast('User deleted successfully', 'success');
      
      // Remove from local state
      setCustomers(prev => prev.filter(c => c._id !== selectedCustomer._id));
      setSelectedCustomer(null);
      
    } catch (error) {
      showToast('Failed to delete user', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleToggleRole = async () => {
    if (!selectedCustomer) return;
    
    const newRole = selectedCustomer.role === 'admin' ? 'customer' : 'admin';
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch(`/api/users/${selectedCustomer._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      const data = await response.json();
      
      showToast(`User role updated to ${newRole}`, 'success');
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c._id === selectedCustomer._id ? { ...c, role: newRole } : c
      ));
      setSelectedCustomer({ ...selectedCustomer, role: newRole });
      
    } catch (error) {
      showToast('Failed to update user role', 'error');
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || customer.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            View and manage customer information
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all hover:border-gray-300"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white transition-all hover:border-gray-300"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>

          <div className="text-sm text-gray-600 text-center sm:text-left">
            <span className="font-semibold text-gray-900">{filteredCustomers.length}</span> customers found
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Customers Table - Desktop */}
        <div className="hidden lg:block flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer._id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedCustomer?._id === customer._id ? 'bg-gray-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden shrink-0 ring-2 ring-gray-100 flex items-center justify-center">
                        {customer.avatar ? (
                          <Image
                            src={customer.avatar}
                            alt={customer.name || 'Customer'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-600">
                            {customer.name?.charAt(0)?.toUpperCase() || customer.email?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{customer.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{customer.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{customer.phone || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      customer.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {customer.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No customers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500">No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => setSelectedCustomer(customer)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden flex items-center justify-center shrink-0">
                    {customer.avatar ? (
                      <Image
                        src={customer.avatar}
                        alt={customer.name || 'Customer'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">
                        {customer.name?.charAt(0)?.toUpperCase() || customer.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {customer.name || 'N/A'}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
                        customer.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 border-purple-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {customer.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">{customer.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{customer.phone || 'No phone'}</span>
                      <span>•</span>
                      <span>Joined {customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer Details Sidebar */}
        {selectedCustomer && (
          <div className="hidden lg:flex w-[420px] bg-white border-l border-gray-200 flex-col shadow-xl">
            {/* Sidebar Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center">
                    {selectedCustomer.avatar ? (
                      <Image
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.name || 'Customer'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">
                        {selectedCustomer.name?.charAt(0)?.toUpperCase() || selectedCustomer.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name || 'N/A'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                        selectedCustomer.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedCustomer.role}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)} 
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Contact Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-gray-900 break-all">{selectedCustomer.email}</p>
                    </div>
                  </div>

                  {selectedCustomer.phone && (
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                  >
                    <EnvelopeIcon className="w-4 h-4 text-white" />
                    <span className="text-white">Email</span>
                  </a>
                  {selectedCustomer.phone && (
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <PhoneIcon className="w-4 h-4 text-white" />
                      <span className="text-white">Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Recent Orders</h3>
                
                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  </div>
                ) : userOrders.length > 0 ? (
                  <div className="space-y-3">
                    {userOrders.map((order) => (
                      <div key={order._id} className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Order ID</p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">#{order.orderNumber || order._id.slice(-8)}</p>
                          </div>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBagIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No orders yet</p>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Admin Actions</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={handleDeleteUser}
                    disabled={deletingUser}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>{deletingUser ? 'Deleting...' : 'Delete User'}</span>
                  </button>
                </div>

                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-800">
                    <strong>Warning:</strong> Deleting a user will permanently remove them from both the database and authentication system. This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Account Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Customer ID</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedCustomer._id}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Joined Date</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {selectedCustomer.createdAt ? formatDate(selectedCustomer.createdAt) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                    <div className="p-3 rounded-xl border border-gray-200 bg-white">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Shipping Address</p>
                      <p className="text-sm text-gray-900">
                        {selectedCustomer.addresses[0].addressLine1}
                        {selectedCustomer.addresses[0].addressLine2 && `, ${selectedCustomer.addresses[0].addressLine2}`}
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state} {selectedCustomer.addresses[0].postalCode}
                      </p>
                      <p className="text-sm text-gray-900">{selectedCustomer.addresses[0].country}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Customer Details Modal */}
        {selectedCustomer && (
          <div className="lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
            {/* Mobile Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="p-4 space-y-6">
              {/* Customer Info */}
              <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center">
                    {selectedCustomer.avatar ? (
                      <Image
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.name || 'Customer'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">
                        {selectedCustomer.name?.charAt(0)?.toUpperCase() || selectedCustomer.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name || 'N/A'}</h2>
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold mt-1 ${
                      selectedCustomer.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {selectedCustomer.role}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <ShoppingBagIcon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{userOrders.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Orders</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(userOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0))}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">Total Spent</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Recent Orders</h3>
                {userOrders.length > 0 ? (
                  <div className="space-y-2">
                    {userOrders.slice(0, 5).map((order: any) => (
                      <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-mono text-gray-500">#{order._id?.substring(0, 8)}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mt-1 ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} • {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No orders yet</p>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Admin Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleDeleteUser}
                    disabled={deletingUser}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>{deletingUser ? 'Deleting...' : 'Delete User'}</span>
                  </button>
                </div>

                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-800">
                    <strong>Warning:</strong> Deleting a user will permanently remove them from both the database and authentication system.
                  </p>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Account Details</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Customer ID</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 break-all">{selectedCustomer._id}</p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Joined Date</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedCustomer.createdAt ? formatDate(selectedCustomer.createdAt) : 'N/A'}
                    </p>
                  </div>

                  {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                    <div className="p-3 rounded-xl border border-gray-200 bg-white">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Shipping Address</p>
                      <p className="text-sm text-gray-900">
                        {selectedCustomer.addresses[0].addressLine1}
                        {selectedCustomer.addresses[0].addressLine2 && `, ${selectedCustomer.addresses[0].addressLine2}`}
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state} {selectedCustomer.addresses[0].postalCode}
                      </p>
                      <p className="text-sm text-gray-900">{selectedCustomer.addresses[0].country}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
