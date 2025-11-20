'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { XMarkIcon, PencilIcon, EnvelopeIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onEdit: (order: Order) => void;
  getStatusBadgeColor: (status?: string) => string;
}

export default function OrderDetailsModal({
  order,
  onClose,
  onEdit,
  getStatusBadgeColor,
}: OrderDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [editingTrackingNumber, setEditingTrackingNumber] = useState(order?.trackingNumber || '');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editingStatus, setEditingStatus] = useState(order?.status || 'pending');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (order) {
      setEditingTrackingNumber(order.trackingNumber || '');
      setEditingStatus(order.status || 'pending');
      setIsEditingStatus(false);
    }
  }, [order]);

  if (!order || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col shadow-2xl" style={{
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.2), 0 -2px 8px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.1), 2px 0 8px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50 flex items-start justify-between" style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{order.orderNumber}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadgeColor(order.status)}`}>
                {order.status || 'pending'}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 min-h-0" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.3) transparent'
        }}>
          <style>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.3);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(0,0,0,0.5);
            }
          `}</style>

          {/* Customer Info Card */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center shrink-0">
                {order.customerAvatar ? (
                  <Image
                    src={order.customerAvatar}
                    alt={order.customerName || 'Customer'}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {order.customerName?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{order.customerName}</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{order.customerEmail}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={`mailto:${order.customerEmail}`} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium border border-gray-200">
                <EnvelopeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </a>
              {order.customerPhone && (
                <a href={`tel:${order.customerPhone}`} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium border border-gray-200">
                  <PhoneIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-3">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                  {item.image && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name || 'Product'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-600">Size: {item.size || 'N/A'}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h4>
            <div className="p-3 border border-gray-200 rounded-lg text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900">{order.shippingAddress?.fullName || order.customerName}</p>
              <p>{order.shippingAddress?.addressLine1 || 'N/A'}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country || 'India'}</p>
              {order.shippingAddress?.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Tracking & Status Information */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900">Tracking & Status</h4>
              <button
                onClick={() => setIsEditingStatus(!isEditingStatus)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit Tracking & Status"
              >
                <PencilIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg space-y-4">
              {isEditingStatus ? (
                <>
                  {/* Order Status Edit */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Order Status</label>
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as "pending" | "processing" | "shipped" | "out for delivery" | "delivered" | "cancelled" | "paid" | "completed")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        paddingRight: '28px'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out for delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Tracking Number Edit */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Tracking Number</label>
                    <input
                      type="text"
                      value={editingTrackingNumber}
                      onChange={(e) => setEditingTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingStatus(false)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (order) {
                          onEdit({ ...order, status: editingStatus as any, trackingNumber: editingTrackingNumber });
                          setIsEditingStatus(false);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Order Status Display */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Order Status</p>
                    <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusBadgeColor(order?.status)}`}>
                      {order?.status || 'pending'}
                    </div>
                  </div>

                  {/* Tracking Number Display */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Tracking Number</p>
                    {order?.trackingNumber ? (
                      <>
                        <p className="font-mono text-sm font-bold text-gray-900 break-all mb-2">{order.trackingNumber}</p>
                        <button
                          onClick={() => window.open(`https://www.ekartlogistics.in/track-order?awb=${order.trackingNumber}`, '_blank')}
                          className="inline-flex items-center justify-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium border border-gray-900 cursor-pointer"
                        >
                          Track via Ekart
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 italic">No tracking number added yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2 p-3 border border-gray-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice((order.total || 0) - (order.shipping || 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">{formatPrice(order.shipping || 0)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatPrice(order.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  
  return ReactDOM.createPortal(modalContent, document.body);
}
