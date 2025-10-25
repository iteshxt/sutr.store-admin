'use client';

import { useEffect, useState } from 'react';
import {
  DocumentChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

interface ReportData {
  salesReport: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProduct: string;
    periodStart: string;
    periodEnd: string;
  };
  inventoryReport: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
  };
  customerReport: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    conversionRate: string;
  };
  orderReport: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
}

type ReportType = 'sales' | 'inventory' | 'customers' | 'orders';
type DateRange = '7days' | '30days' | '90days' | 'all';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

      const response = await fetch(`/api/reports?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();

      if (data.success) {
        setReportData(data.report);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData) return;
    
    setGeneratingPDF(true);
    
    try {
      // Create PDF content
      let pdfContent = `${selectedReport.toUpperCase()} REPORT\n`;
      pdfContent += `Generated: ${new Date().toLocaleString()}\n`;
      pdfContent += `Period: ${dateRange}\n`;
      pdfContent += `\n${'='.repeat(50)}\n\n`;

      if (selectedReport === 'sales') {
        pdfContent += `SALES PERFORMANCE\n\n`;
        pdfContent += `Total Revenue: ${formatPrice(reportData.salesReport.totalRevenue)}\n`;
        pdfContent += `Total Orders: ${reportData.salesReport.totalOrders}\n`;
        pdfContent += `Average Order Value: ${formatPrice(reportData.salesReport.averageOrderValue)}\n`;
        pdfContent += `Top Product: ${reportData.salesReport.topSellingProduct}\n`;
      } else if (selectedReport === 'inventory') {
        pdfContent += `INVENTORY STATUS\n\n`;
        pdfContent += `Total Products: ${reportData.inventoryReport.totalProducts}\n`;
        pdfContent += `Low Stock: ${reportData.inventoryReport.lowStockProducts}\n`;
        pdfContent += `Out of Stock: ${reportData.inventoryReport.outOfStockProducts}\n`;
        pdfContent += `Total Value: ${formatPrice(reportData.inventoryReport.totalValue)}\n`;
      } else if (selectedReport === 'customers') {
        pdfContent += `CUSTOMER INSIGHTS\n\n`;
        pdfContent += `Total Customers: ${reportData.customerReport.totalCustomers}\n`;
        pdfContent += `New Customers: ${reportData.customerReport.newCustomers}\n`;
        pdfContent += `Returning Customers: ${reportData.customerReport.returningCustomers}\n`;
        pdfContent += `Conversion Rate: ${reportData.customerReport.conversionRate}%\n`;
      } else if (selectedReport === 'orders') {
        pdfContent += `ORDER STATUS\n\n`;
        pdfContent += `Pending: ${reportData.orderReport.pending}\n`;
        pdfContent += `Processing: ${reportData.orderReport.processing}\n`;
        pdfContent += `Completed: ${reportData.orderReport.completed}\n`;
        pdfContent += `Cancelled: ${reportData.orderReport.cancelled}\n`;
      }

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}-report-${dateRange}-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate report', 'error');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    
    try {
      let csvContent = '';

      if (selectedReport === 'sales') {
        csvContent = 'Metric,Value\n';
        csvContent += `Total Revenue,${reportData.salesReport.totalRevenue}\n`;
        csvContent += `Total Orders,${reportData.salesReport.totalOrders}\n`;
        csvContent += `Average Order Value,${reportData.salesReport.averageOrderValue}\n`;
        csvContent += `Top Product,${reportData.salesReport.topSellingProduct}\n`;
      } else if (selectedReport === 'inventory') {
        csvContent = 'Metric,Count\n';
        csvContent += `Total Products,${reportData.inventoryReport.totalProducts}\n`;
        csvContent += `Low Stock,${reportData.inventoryReport.lowStockProducts}\n`;
        csvContent += `Out of Stock,${reportData.inventoryReport.outOfStockProducts}\n`;
        csvContent += `Total Value,${reportData.inventoryReport.totalValue}\n`;
      } else if (selectedReport === 'customers') {
        csvContent = 'Metric,Count\n';
        csvContent += `Total Customers,${reportData.customerReport.totalCustomers}\n`;
        csvContent += `New Customers,${reportData.customerReport.newCustomers}\n`;
        csvContent += `Returning Customers,${reportData.customerReport.returningCustomers}\n`;
        csvContent += `Conversion Rate,${reportData.customerReport.conversionRate}%\n`;
      } else if (selectedReport === 'orders') {
        csvContent = 'Status,Count\n';
        csvContent += `Pending,${reportData.orderReport.pending}\n`;
        csvContent += `Processing,${reportData.orderReport.processing}\n`;
        csvContent += `Completed,${reportData.orderReport.completed}\n`;
        csvContent += `Cancelled,${reportData.orderReport.cancelled}\n`;
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}-report-${dateRange}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('CSV exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export CSV', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generate and export detailed business reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={generatePDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-white" />
              <span className="text-white">{generatingPDF ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-8 min-h-0">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Report Type Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Report Type:</span>
              <div className="flex gap-2">
                {(['sales', 'inventory', 'customers', 'orders'] as ReportType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedReport(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedReport === type
                        ? 'bg-black text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Cards */}
          {reportData && (
            <>
              {/* Sales Report */}
              {selectedReport === 'sales' && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Sales Performance Report</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(reportData.salesReport.periodStart).toLocaleDateString()} - {new Date(reportData.salesReport.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-100 p-3 ring-4 ring-white shadow-md">
                        <DocumentChartBarIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{formatPrice(reportData.salesReport.totalRevenue)}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Completed transactions</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{reportData.salesReport.totalOrders}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>Order count</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{formatPrice(reportData.salesReport.averageOrderValue)}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-purple-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Per transaction</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Product</p>
                      <p className="mt-2 text-lg font-bold text-gray-900 truncate">{reportData.salesReport.topSellingProduct}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-orange-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Best seller</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Summary</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• Total revenue generated: <span className="font-bold text-gray-900">{formatPrice(reportData.salesReport.totalRevenue)}</span></p>
                      <p>• Number of completed orders: <span className="font-bold text-gray-900">{reportData.salesReport.totalOrders}</span></p>
                      <p>• Average transaction value: <span className="font-bold text-gray-900">{formatPrice(reportData.salesReport.averageOrderValue)}</span></p>
                      <p>• Top performing product: <span className="font-bold text-gray-900">{reportData.salesReport.topSellingProduct}</span></p>
                      <p className="pt-3 border-t border-gray-200">
                        This report shows sales performance for the selected period. Use the filters above to adjust the date range and view different metrics.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Report */}
              {selectedReport === 'inventory' && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Inventory Status Report</h2>
                        <p className="text-sm text-gray-600 mt-1">Current inventory levels and stock alerts</p>
                      </div>
                      <div className="rounded-xl bg-green-100 p-3 ring-4 ring-white shadow-md">
                        <DocumentChartBarIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Products</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{reportData.inventoryReport.totalProducts}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>In catalog</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Low Stock</p>
                      <p className="mt-2 text-3xl font-bold text-yellow-600">{reportData.inventoryReport.lowStockProducts}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>Needs restock</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Out of Stock</p>
                      <p className="mt-2 text-3xl font-bold text-red-600">{reportData.inventoryReport.outOfStockProducts}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-red-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>Urgent action</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Value</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{formatPrice(reportData.inventoryReport.totalValue)}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Inventory worth</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Analysis</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• Total products in catalog: <span className="font-bold text-gray-900">{reportData.inventoryReport.totalProducts}</span></p>
                      <p>• Products requiring restock: <span className="font-bold text-yellow-600">{reportData.inventoryReport.lowStockProducts}</span></p>
                      <p>• Products out of stock: <span className="font-bold text-red-600">{reportData.inventoryReport.outOfStockProducts}</span></p>
                      <p>• Total inventory value: <span className="font-bold text-gray-900">{formatPrice(reportData.inventoryReport.totalValue)}</span></p>
                      {(reportData.inventoryReport.lowStockProducts > 0 || reportData.inventoryReport.outOfStockProducts > 0) && (
                        <p className="pt-3 border-t border-gray-200 text-yellow-700 font-medium">
                          ⚠️ Action Required: {reportData.inventoryReport.outOfStockProducts > 0 && `${reportData.inventoryReport.outOfStockProducts} products are out of stock. `}
                          {reportData.inventoryReport.lowStockProducts > 0 && `${reportData.inventoryReport.lowStockProducts} products are running low.`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Report */}
              {selectedReport === 'customers' && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Customer Insights Report</h2>
                        <p className="text-sm text-gray-600 mt-1">Customer acquisition and retention metrics</p>
                      </div>
                      <div className="rounded-xl bg-purple-100 p-3 ring-4 ring-white shadow-md">
                        <DocumentChartBarIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Customers</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{reportData.customerReport.totalCustomers}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Registered users</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Customers</p>
                      <p className="mt-2 text-3xl font-bold text-green-600">{reportData.customerReport.newCustomers}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>This period</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Returning</p>
                      <p className="mt-2 text-3xl font-bold text-purple-600">{reportData.customerReport.returningCustomers}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-purple-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Repeat buyers</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conversion Rate</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{reportData.customerReport.conversionRate}%</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-orange-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Purchase rate</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Analysis</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• Total registered customers: <span className="font-bold text-gray-900">{reportData.customerReport.totalCustomers}</span></p>
                      <p>• New customer acquisitions: <span className="font-bold text-green-600">{reportData.customerReport.newCustomers}</span></p>
                      <p>• Returning customers: <span className="font-bold text-purple-600">{reportData.customerReport.returningCustomers}</span></p>
                      <p>• Conversion rate: <span className="font-bold text-gray-900">{reportData.customerReport.conversionRate}%</span></p>
                      <p className="pt-3 border-t border-gray-200">
                        Customer retention: {reportData.customerReport.totalCustomers > 0 
                          ? ((reportData.customerReport.returningCustomers / reportData.customerReport.totalCustomers) * 100).toFixed(1)
                          : 0}% of customers have made repeat purchases.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Report */}
              {selectedReport === 'orders' && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-linear-to-br from-orange-50 to-red-50 border border-orange-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Order Status Report</h2>
                        <p className="text-sm text-gray-600 mt-1">Breakdown of orders by current status</p>
                      </div>
                      <div className="rounded-xl bg-orange-100 p-3 ring-4 ring-white shadow-md">
                        <DocumentChartBarIcon className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
                      <p className="mt-2 text-3xl font-bold text-yellow-600">{reportData.orderReport.pending}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>Awaiting action</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Processing</p>
                      <p className="mt-2 text-3xl font-bold text-blue-600">{reportData.orderReport.processing}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>In progress</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</p>
                      <p className="mt-2 text-3xl font-bold text-green-600">{reportData.orderReport.completed}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Delivered</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cancelled</p>
                      <p className="mt-2 text-3xl font-bold text-red-600">{reportData.orderReport.cancelled}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-red-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>Not fulfilled</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status Breakdown</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• Pending orders: <span className="font-bold text-yellow-600">{reportData.orderReport.pending}</span></p>
                      <p>• Orders being processed: <span className="font-bold text-blue-600">{reportData.orderReport.processing}</span></p>
                      <p>• Completed orders: <span className="font-bold text-green-600">{reportData.orderReport.completed}</span></p>
                      <p>• Cancelled orders: <span className="font-bold text-red-600">{reportData.orderReport.cancelled}</span></p>
                      <p className="pt-3 border-t border-gray-200">
                        Fulfillment rate: {(reportData.orderReport.pending + reportData.orderReport.processing + reportData.orderReport.completed + reportData.orderReport.cancelled) > 0
                          ? ((reportData.orderReport.completed / (reportData.orderReport.pending + reportData.orderReport.processing + reportData.orderReport.completed + reportData.orderReport.cancelled)) * 100).toFixed(1)
                          : 0}% of orders have been successfully completed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
