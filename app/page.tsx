'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatPrice, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

interface Stats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  salesGrowth: string;
  ordersGrowth: string;
  customersGrowth: string;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface DashboardData {
  stats: Stats;
  pendingOrdersCount: number;
  topProduct: { name: string; count: number };
  statusBreakdown: {
    pending: number;
    processing: number;
    shipped: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: RecentOrder[];
}

export default function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    salesGrowth: '0',
    ordersGrowth: '0',
    customersGrowth: '0',
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [topProduct, setTopProduct] = useState({ name: 'No sales', count: 0 });
  const [statusBreakdown, setStatusBreakdown] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        next: { revalidate: 30 },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setPendingOrdersCount(data.pendingOrdersCount || 0);
        setTopProduct(data.topProduct || { name: 'No sales', count: 0 });
        setStatusBreakdown(data.statusBreakdown || {
          pending: 0,
          processing: 0,
          shipped: 0,
          outForDelivery: 0,
          delivered: 0,
          cancelled: 0,
        });
      }
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      name: 'Total Sales',
      value: formatPrice(stats.totalSales),
      icon: CurrencyDollarIcon,
      change: `${stats.salesGrowth}%`,
      changeType: parseFloat(stats.salesGrowth) >= 0 ? 'positive' : 'negative',
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCartIcon,
      change: `${stats.ordersGrowth}%`,
      changeType: parseFloat(stats.ordersGrowth) >= 0 ? 'positive' : 'negative',
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: UsersIcon,
      change: `${stats.customersGrowth}%`,
      changeType: parseFloat(stats.customersGrowth) >= 0 ? 'positive' : 'negative',
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: ShoppingBagIcon,
      change: 'N/A',
      changeType: 'neutral',
      gradient: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Welcome back! Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.name}
                className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`rounded-xl ${card.iconBg} p-3 ring-4 ring-white shadow-md`}>
                      <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                    {card.changeType !== 'neutral' && (
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          card.changeType === 'positive' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {card.changeType === 'positive' ? (
                          <ArrowTrendingUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-3 w-3" />
                        )}
                        {card.change}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.name}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Orders Section */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Orders</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Latest transactions from your store</p>
                </div>
                <Link
                  href="/orders"
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                >
                  <span className="text-white">View All Orders</span>
                </Link>
              </div>
            </div>
            
            {recentOrders.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order ID</th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Items</th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 lg:px-6 py-4">
                            <span className="text-sm font-semibold text-gray-900">#{order.orderNumber}</span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className="text-sm text-gray-900">{order.customerEmail}</span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBagIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {recentOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-bold text-gray-900">#{order.orderNumber}</span>
                        <p className="text-xs text-gray-600 mt-1">{order.customerEmail}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <ShoppingBagIcon className="w-4 h-4" />
                        <span>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="font-bold text-gray-900">{formatPrice(order.total)}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{formatDate(order.createdAt)}</div>
                  </div>
                ))}
              </div>
            </>
            ) : (
              <div className="p-12 text-center">
                <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No orders yet</p>
                <p className="text-sm text-gray-500 mt-1">Orders will appear here once customers start placing them</p>
              </div>
            )}
          </div>

          {/* Quick Stats Row */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-600 p-3 shadow-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Avg Order Value</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.totalOrders > 0 ? formatPrice(stats.totalSales / stats.totalOrders) : formatPrice(0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-linear-to-br from-purple-50 to-pink-50 border border-purple-100 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-600 p-3 shadow-lg">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">Orders per Customer</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.totalCustomers > 0 ? (stats.totalOrders / stats.totalCustomers).toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-linear-to-br from-red-50 to-orange-50 border border-red-100 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-600 p-3 shadow-lg">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Pending Orders</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{pendingOrdersCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Product & Status Breakdown */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Top Selling Product */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Top Selling Product</h3>
                  <p className="text-sm text-gray-600 mt-1">This month</p>
                </div>
                <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-gray-700 mb-2">Product Name</p>
                <p className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">{topProduct.name}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Units Sold</p>
                    <p className="text-3xl font-bold text-green-700">{topProduct.count}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                    <ShoppingBagIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order Status</h3>
                  <p className="text-sm text-gray-600 mt-1">All orders breakdown</p>
                </div>
                <ChartBarIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">Pending</span>
                  </div>
                  <span className="font-bold text-gray-900">{statusBreakdown.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700">Processing</span>
                  </div>
                  <span className="font-bold text-gray-900">{statusBreakdown.processing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-700">Shipped</span>
                  </div>
                  <span className="font-bold text-gray-900">{statusBreakdown.shipped}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm text-gray-700">Out for Delivery</span>
                  </div>
                  <span className="font-bold text-gray-900">{statusBreakdown.outForDelivery}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">Delivered</span>
                  </div>
                  <span className="font-bold text-gray-900">{statusBreakdown.delivered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">Cancelled</span>
                  </div>
                  <span className="font-bold text-gray-900">{statusBreakdown.cancelled}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
