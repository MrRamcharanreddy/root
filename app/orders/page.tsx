'use client';

import { useOrderStore } from '@/lib/orderStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Calendar, MapPin, ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { toDate } from '@/lib/dateUtils';

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

function OrdersContent() {
  const allOrders = useOrderStore((state) => state.getAllOrders());
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const [searchTerm, setSearchTerm] = useState('');

  // CRITICAL SECURITY FIX: Filter orders by current user's email
  // Also validate that orders belong to current user
  const userOrders = currentUser
    ? allOrders.filter(order => {
        const orderEmail = order.shippingAddress?.email?.toLowerCase();
        const userEmail = currentUser.email.toLowerCase();
        // Only show orders that match current user's email
        return orderEmail === userEmail;
      })
    : [];

  const filteredOrders = userOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shippingAddress.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userOrders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">No Orders Yet</h1>
          <p className="text-gray-600 mb-8">
            You haven&apos;t placed any orders yet. Start shopping to see your orders here!
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by order ID or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No orders found matching your search.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center space-x-4 mb-2">
                      <h2 className="text-xl font-bold">Order {order.id}</h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          statusColors[order.status]
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {order.createdAt ? format(toDate(order.createdAt) || new Date(), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="font-semibold text-gray-900">
                        ${order.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>

                {/* Order Items Preview */}
                <div className="border-t pt-4">
                  <div className="flex space-x-4 overflow-x-auto pb-2">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address Preview */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      {order.shippingAddress.city}, {order.shippingAddress.state},{' '}
                      {order.shippingAddress.country}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}

