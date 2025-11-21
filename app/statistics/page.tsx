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
  dailyStats?: Array<{ date: string; orders: number; revenue: number; customers: number }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e'];

// Map order statuses to colors
const getOrderStatusColor = (status: string): string => {
  const statusColorMap: { [key: string]: string } = {
    'pending': '#fbbf24',      // Yellow
    'processing': '#3b82f6',    // Blue
    'shipped': '#a78bfa',       // Purple
    'out for delivery': '#818cf8', // Indigo
    'delivered': '#10b981',     // Green
    'cancelled': '#ef4444',     // Red
  };
  return statusColorMap[status?.toLowerCase()] || '#6b7280'; // Default gray
};

// Custom Tooltip Components
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 backdrop-blur-sm">
        <p className="text-xs text-gray-600">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueTooltip = ({ active, payload }: any) => {
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
};

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
      
      if (data.success && data.statistics) {
        // Fill missing dates in revenue data
        const filledRevenueData = fillMissingDates(data.statistics.revenueByDay);
        // Calculate cumulative customers
        const cumulativeCustomers = calculateCumulativeCustomers(data.statistics.customerGrowth);
        
        setStatistics({
          ...data.statistics,
          revenueByDay: filledRevenueData,
          customerGrowth: cumulativeCustomers,
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fill missing dates in revenue data
  const fillMissingDates = (data: Array<{ _id: string; revenue: number; orders: number }>) => {
    if (!data || data.length === 0) return [];

    const filled = [];
    const dates = data.map(d => new Date(d._id));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = data.find(item => item._id === dateStr);
      filled.push({
        _id: dateStr,
        revenue: existing?.revenue || 0,
        orders: existing?.orders || 0,
      });
    }
    return filled;
  };

  // Calculate cumulative customers
  const calculateCumulativeCustomers = (data: Array<{ _id: string; newCustomers: number }>) => {
    if (!data || data.length === 0) return [];

    let cumulative = 0;
    return data.map(item => ({
      _id: item._id,
      newCustomers: (cumulative += item.newCustomers),
      dailyNew: item.newCustomers,
    }));
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">No statistics available</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic limits
  const maxRevenue = Math.max(...statistics.revenueByDay.map(d => d.revenue), 0) * 1.2;
  const maxOrders = Math.max(...statistics.revenueByDay.map(d => d.orders), 0) * 1.2;
  const maxCustomers = Math.max(...(statistics.customerGrowth as any[]).map((c: any) => c.newCustomers || 0), 1) * 1.2;

  // Calculate max revenue for products chart
  const maxProductRevenue = Math.max(...statistics.topProducts.map(p => p.totalRevenue), 0);
  // Round up to nearest thousand for clean Y-axis
  const yAxisMax = Math.ceil(maxProductRevenue / 1000) * 1000 || 1000;

  const monthlyGrowth = statistics.monthlyComparison.lastMonth > 0
    ? ((statistics.monthlyComparison.thisMonth - statistics.monthlyComparison.lastMonth) / statistics.monthlyComparison.lastMonth) * 100
    : 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Statistics & Analytics</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Comprehensive insights into your store's performance
            </p>
          </div>
          <button
            onClick={fetchStatistics}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm w-full sm:w-auto"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Key Metrics - 4 Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Monthly Revenue */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-2.5 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  monthlyGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {monthlyGrowth >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                  {Math.abs(monthlyGrowth).toFixed(1)}%
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatPrice(statistics.monthlyComparison.thisMonth)}</p>
              <p className="text-xs text-gray-600 mt-1">Last month: {formatPrice(statistics.monthlyComparison.lastMonth)}</p>
            </div>

            {/* Orders (7 Days) */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-2.5 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Orders (7 Days)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.recentActivity.orders}</p>
              <p className="text-xs text-gray-600 mt-1">Revenue: {formatPrice(statistics.recentActivity.revenue)}</p>
            </div>

            {/* New Customers */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-2.5 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">New Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.recentActivity.newCustomers}</p>
              <p className="text-xs text-gray-600 mt-1">Conversion: {statistics.conversionRate}%</p>
            </div>

            {/* Avg Order Value */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-2.5 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatPrice(statistics.averageOrderValue.avgValue)}</p>
              <p className="text-xs text-gray-600 mt-1">
                {formatPrice(statistics.averageOrderValue.minValue)} - {formatPrice(statistics.averageOrderValue.maxValue)}
              </p>
            </div>
          </div>

          {/* Inventory Alerts */}
          {(statistics.productMetrics.lowStock > 0 || statistics.productMetrics.outOfStock > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 text-sm">Inventory Alerts</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    {statistics.productMetrics.outOfStock > 0 && `${statistics.productMetrics.outOfStock} products out of stock. `}
                    {statistics.productMetrics.lowStock > 0 && `${statistics.productMetrics.lowStock} products low in stock.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
            <p className="text-sm text-gray-600 mt-1">Last 30 days performance</p>
            
            {statistics.revenueByDay.length > 0 ? (
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={statistics.revenueByDay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="_id" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      stroke="#e5e7eb"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#e5e7eb"
                      domain={[0, maxRevenue]}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
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
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 mt-6">
                <p>No revenue data available</p>
              </div>
            )}
          </div>

          {/* Two Column Layout for Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">Order Status Distribution</h2>
              <p className="text-sm text-gray-600 mt-1">Current order breakdown</p>
              
              {statistics.ordersByStatus.length > 0 ? (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statistics.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ _id, percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statistics.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getOrderStatusColor(entry._id)} />
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
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 mt-6">
                  <p>No data available</p>
                </div>
              )}
            </div>

            {/* Customer Growth */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">Customer Growth</h2>
              <p className="text-sm text-gray-600 mt-1">Cumulative growth (Last 30 days)</p>
              
              {(statistics.customerGrowth as any[]).length > 0 ? (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={statistics.customerGrowth as any[]} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="_id" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      stroke="#e5e7eb"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#e5e7eb"
                      domain={[0, Math.ceil(maxCustomers)]}
                      allowDecimals={false}
                      type="number"
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="text-xs text-gray-600">{new Date(payload[0].payload._id).toLocaleDateString()}</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">Total Customers: {Math.round(payload[0].value)}</p>
                              <p className="text-xs text-gray-600">New Today: {(payload[0].payload as any).dailyNew}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newCustomers" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 mt-6">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Best performers by revenue</p>
              </div>
            </div>
            
            {statistics.topProducts.length > 0 ? (
              <div className="space-y-6 sm:space-y-8">
                {/* Bar Chart */}
                <div className="bg-linear-to-br from-gray-50 to-white rounded-lg p-3 sm:p-4 border border-gray-100">
                  <div className="overflow-x-auto">
                    <div className="min-w-full sm:min-w-0">
                      <ResponsiveContainer width="100%" height={500} minHeight={500}>
                        <BarChart 
                          data={statistics.topProducts}
                          margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#e5e7eb"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }} 
                            stroke="#e5e7eb"
                            domain={[0, yAxisMax]}
                            tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                                    <p className="text-sm font-bold text-gray-900 mb-2">{payload[0].payload.name}</p>
                                    <div className="space-y-1">
                                      <p className="text-xs"><span className="text-gray-600">Revenue:</span> <span className="font-semibold text-blue-600">{formatPrice(payload[0].payload.totalRevenue)}</span></p>
                                      <p className="text-xs"><span className="text-gray-600">Units Sold:</span> <span className="font-semibold text-gray-900">{payload[0].payload.totalQuantity}</span></p>
                                      <p className="text-xs"><span className="text-gray-600">Avg Price:</span> <span className="font-semibold text-gray-900">{formatPrice(payload[0].payload.totalRevenue / payload[0].payload.totalQuantity)}</span></p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="totalRevenue" 
                            fill="#3b82f6" 
                            radius={[8, 8, 0, 0]}
                            maxBarSize={30}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-2">
                      {formatPrice(statistics.topProducts.reduce((sum, p) => sum + p.totalRevenue, 0))}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">From top products</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Units Sold</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-2">
                      {statistics.topProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Total quantity</p>
                  </div>
                  <div className="bg-linear-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Avg per Product</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 mt-2">
                      {formatPrice(statistics.topProducts.reduce((sum, p) => sum + p.totalRevenue, 0) / statistics.topProducts.length)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Average revenue</p>
                  </div>
                  <div className="bg-linear-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Top Product</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-2">
                      {statistics.topProducts.length > 0 ? ((statistics.topProducts[0].totalRevenue / statistics.topProducts.reduce((sum, p) => sum + p.totalRevenue, 0)) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Market share</p>
                  </div>
                </div>

                {/* Product Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">#</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Product</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Units</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Revenue</th>
                        <th className="hidden sm:table-cell text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Avg Price</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.topProducts.slice(0, 10).map((product, index) => {
                        const totalRevenue = statistics.topProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
                        const share = ((product.totalRevenue / totalRevenue) * 100).toFixed(1);
                        
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div>
                                <p className="text-gray-900 font-medium line-clamp-2">{product.name}</p>
                                {index < 3 && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                    ⭐ Top {index + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                              <span className="font-semibold text-gray-900">{product.totalQuantity}</span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                              <span className="font-bold text-blue-600">{formatPrice(product.totalRevenue)}</span>
                            </td>
                            <td className="hidden sm:table-cell py-2 sm:py-3 px-2 sm:px-4 text-right text-gray-600">
                              <span className="text-xs sm:text-sm">{formatPrice(product.totalRevenue / product.totalQuantity)}</span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-10 sm:w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all" 
                                    style={{ width: `${Math.min(parseFloat(share), 100)}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-gray-900 w-8 sm:w-10 text-right text-xs sm:text-sm">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500 mt-6">
                <p>No product data available</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
