'use client';

import { useOrderStore } from '@/lib/orderStore';
import SellerRoute from '@/components/SellerRoute';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Calendar, MapPin, Search, Filter, CheckCircle, Clock, Box, Truck, ArrowUpDown, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toDate } from '@/lib/dateUtils';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const statusIcons = {
  pending: Clock,
  processing: Box,
  shipped: Truck,
  delivered: CheckCircle,
};

function SellerOrdersContent() {
  const orders = useOrderStore((state) => state.getAllOrders());
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'total':
        comparison = a.total - b.total;
        break;
      case 'status':
        const statusOrder = { pending: 0, processing: 1, shipped: 2, delivered: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleStatusUpdate = (orderId: string, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered') => {
    updateOrderStatus(orderId, newStatus);
    const statusMessages: Record<string, string> = {
      pending: 'Order status set to Pending',
      processing: 'Order marked as Processing - Start packing!',
      shipped: 'Order marked as Shipped!',
      delivered: 'Order marked as Delivered!',
    };
    toast.success(statusMessages[newStatus] || 'Order status updated');
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  // Show loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Seller Orders Dashboard</h1>
          <p className="text-gray-600">Manage and pack customer orders</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Seller Orders Dashboard</h1>
        <p className="text-gray-600">Manage and pack customer orders</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Processing</p>
              <p className="text-3xl font-bold text-blue-600">{processingCount}</p>
            </div>
            <Box className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Shipped</p>
              <p className="text-3xl font-bold text-purple-600">{shippedCount}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Delivered</p>
              <p className="text-3xl font-bold text-green-600">{deliveredCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="processing">Processing ({processingCount})</option>
              <option value="shipped">Shipped ({shippedCount})</option>
              <option value="delivered">Delivered ({deliveredCount})</option>
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as 'date' | 'total' | 'status');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent appearance-none bg-white"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="total-desc">Highest Total</option>
              <option value="total-asc">Lowest Total</option>
              <option value="status-asc">Status (Pending First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Priority Alert for Pending Orders */}
      {pendingCount > 0 && statusFilter === 'all' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-semibold text-yellow-900">
                {pendingCount} order{pendingCount !== 1 ? 's' : ''} pending processing
              </p>
              <p className="text-sm text-yellow-700">
                Click &quot;Start Packing&quot; to begin processing these orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {sortedOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
        {statusFilter !== 'all' && ` (${statusFilter})`}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No orders found matching your criteria.</p>
          </div>
        ) : (
          sortedOrders.map((order) => {
            const StatusIcon = statusIcons[order.status];
            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="mb-4 lg:mb-0">
                      <div className="flex items-center space-x-4 mb-2">
                        <h2 className="text-xl font-bold">Order {order.id}</h2>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center ${
                            statusColors[order.status]
                          }`}
                        >
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {order.createdAt ? format(toDate(order.createdAt) || new Date(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </div>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="font-semibold text-gray-900">
                          ${order.total.toFixed(2)}
                        </div>
                        {order.trackingNumber && (
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Track: {order.trackingNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'processing')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                        >
                          Start Packing
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'shipped')}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-semibold mr-2">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="ml-2">{order.shippingAddress.email}</span>
                      <span className="text-gray-500 ml-2">•</span>
                      <span className="ml-2">
                        {order.shippingAddress.city}, {order.shippingAddress.country}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t pt-4">
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 flex items-center space-x-3 bg-gray-50 rounded-lg p-2 min-w-[200px]"
                        >
                          <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-semibold text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-xs font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <SellerRoute>
      <SellerOrdersContent />
    </SellerRoute>
  );
}

