'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

interface Statistics {
  revenueByDay: Array<{ _id: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ _id: string; count: number; revenue: number }>;
  topProducts: Array<{ _id: string; name: string; totalQuantity: number; totalRevenue: number }>;
  customerGrowth: Array<{ _id: string; newCustomers: number }>;
  revenueByCategory: Array<{ _id: string; revenue: number; quantity: number }>;
  averageOrderValue: { avgValue: number; minValue: number; maxValue: number };
  conversionRate: string;
  recentActivity: { orders: number; revenue: number; newCustomers: number };
  monthlyComparison: { thisMonth: number; lastMonth: number };
  productMetrics: { total: number; lowStock: number; outOfStock: number };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316'];

export default function StatisticsPage() {
  const { showToast } = useToast();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch('/api/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">No statistics available</p>
      </div>
    );
  }

  const monthlyGrowth = statistics.monthlyComparison.lastMonth > 0
    ? ((statistics.monthlyComparison.thisMonth - statistics.monthlyComparison.lastMonth) / statistics.monthlyComparison.lastMonth) * 100
    : 0;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistics & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive insights into your store's performance
            </p>
          </div>
          <button
            onClick={fetchStatistics}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg"
          >
            <ArrowPathIcon className="w-4 h-4 text-white" />
            <span className="text-white">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-8 min-h-0">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Key Metrics Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Monthly Revenue */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-linear-to-br from-green-500 to-emerald-600 opacity-5"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-green-100 p-3 ring-4 ring-white shadow-md">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    monthlyGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {monthlyGrowth >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                    {Math.abs(monthlyGrowth).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">This Month</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{formatPrice(statistics.monthlyComparison.thisMonth)}</p>
                  <p className="text-xs text-gray-600 mt-2">Last month: {formatPrice(statistics.monthlyComparison.lastMonth)}</p>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 opacity-5"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-blue-100 p-3 ring-4 ring-white shadow-md">
                    <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orders (7 Days)</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{statistics.recentActivity.orders}</p>
                  <p className="text-xs text-gray-600 mt-2">Revenue: {formatPrice(statistics.recentActivity.revenue)}</p>
                </div>
              </div>
            </div>

            {/* New Customers */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-600 opacity-5"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-purple-100 p-3 ring-4 ring-white shadow-md">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Customers</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{statistics.recentActivity.newCustomers}</p>
                  <p className="text-xs text-gray-600 mt-2">Conversion: {statistics.conversionRate}%</p>
                </div>
              </div>
            </div>

            {/* Avg Order Value */}
            <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-linear-to-br from-orange-500 to-red-600 opacity-5"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-orange-100 p-3 ring-4 ring-white shadow-md">
                    <ChartBarIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{formatPrice(statistics.averageOrderValue.avgValue)}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    {formatPrice(statistics.averageOrderValue.minValue)} - {formatPrice(statistics.averageOrderValue.maxValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Alerts */}
          {(statistics.productMetrics.lowStock > 0 || statistics.productMetrics.outOfStock > 0) && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 text-sm">Inventory Alerts</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    {statistics.productMetrics.outOfStock > 0 && `${statistics.productMetrics.outOfStock} products out of stock. `}
                    {statistics.productMetrics.lowStock > 0 && `${statistics.productMetrics.lowStock} products low in stock.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={statistics.revenueByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="_id" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="text-xs text-gray-600">{new Date(payload[0].payload._id).toLocaleDateString()}</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">Revenue: {formatPrice(payload[0].value as number)}</p>
                          <p className="text-xs text-gray-600">Orders: {payload[0].payload.orders}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Two Column Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Orders by Status */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Orders by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, percent }: any) => `${_id}: ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statistics.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-sm font-bold text-gray-900">{payload[0].payload._id}</p>
                            <p className="text-xs text-gray-600 mt-1">Orders: {payload[0].value}</p>
                            <p className="text-xs text-gray-600">Revenue: {formatPrice(payload[0].payload.revenue)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Growth */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Customer Growth (Last 30 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statistics.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="_id" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-xs text-gray-600">{new Date(payload[0].payload._id).toLocaleDateString()}</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">New: {payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="newCustomers" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Selling Products</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statistics.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="text-sm font-bold text-gray-900">{payload[0].payload.name}</p>
                          <p className="text-xs text-gray-600 mt-1">Quantity: {payload[0].value}</p>
                          <p className="text-xs text-gray-600">Revenue: {formatPrice(payload[0].payload.totalRevenue)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQuantity" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Category */}
          {statistics.revenueByCategory.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.revenueByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-sm font-bold text-gray-900">{payload[0].payload._id || 'Uncategorized'}</p>
                            <p className="text-xs text-gray-600 mt-1">Revenue: {formatPrice(payload[0].value as number)}</p>
                            <p className="text-xs text-gray-600">Units: {payload[0].payload.quantity}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
