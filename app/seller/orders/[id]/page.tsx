'use client';

import { useParams } from 'next/navigation';
import { useOrderStore } from '@/lib/orderStore';
import SellerRoute from '@/components/SellerRoute';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Truck,
  CheckCircle,
  Clock,
  Box,
  Printer,
  ArrowLeft,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toDate } from '@/lib/dateUtils';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Box },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

function SellerOrderDetailContent() {
  const params = useParams();
  const orderId = params?.id as string;
  const order = useOrderStore((state) => state.getOrderById(orderId));
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-8">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/seller/orders"
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((step) => step.key === order.status);
  // Free shipping when buying 2 or more items together (based on total quantity)
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isIndia = order.shippingAddress?.country === 'IN' || order.shippingAddress?.country === 'India';
  // ₹149 at rate 83 = $1.795 USD
  const baseShipping = isIndia ? 1.795 : 9.99;
  const shipping = totalItems >= 2 ? 0 : baseShipping;
  const subtotal = order.total - shipping;

  const handleStatusUpdate = (newStatus: 'pending' | 'processing' | 'shipped' | 'delivered') => {
    updateOrderStatus(order.id, newStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/seller/orders"
          className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Order {order.id}</h1>
            <p className="text-gray-600">
              Placed on {order.createdAt ? format(toDate(order.createdAt) || new Date(), 'MMMM dd, yyyy HH:mm') : 'N/A'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : order.status === 'processing'
                  ? 'bg-blue-100 text-blue-800'
                  : order.status === 'shipped'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Order Status</h2>
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.key} className="flex items-start">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-semibold ${
                            isCompleted ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <div className="flex space-x-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate('processing')}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
                              >
                                Start Packing
                              </button>
                            )}
                            {order.status === 'processing' && (
                              <button
                                onClick={() => handleStatusUpdate('shipped')}
                                className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-purple-700"
                              >
                                Mark Shipped
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button
                                onClick={() => handleStatusUpdate('delivered')}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700"
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isCurrent && order.status === 'shipped' && order.trackingNumber && (
                        <p className="text-sm text-gray-600 mt-1">
                          Tracking: {order.trackingNumber}
                        </p>
                      )}
                      {isCurrent && order.status === 'shipped' && order.estimatedDelivery && (
                        <p className="text-sm text-gray-600 mt-1">
                          Estimated delivery:{' '}
                          {format(toDate(order.estimatedDelivery) || new Date(), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Packing List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Packing List</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.id} | Weight: {item.weight || 'N/A'}
                    </p>
                    {item.ingredients && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ingredients: {item.ingredients.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">Qty: {item.quantity}</p>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Packing Order
                </button>
              )}
              {order.status === 'processing' && (
                <button
                  onClick={() => handleStatusUpdate('shipped')}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Mark as Shipped
                </button>
              )}
              {order.status === 'shipped' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Mark as Delivered
                </button>
              )}
              <button
                onClick={handlePrint}
                className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Packing Slip
              </button>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary-600" />
              Shipping Address
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  {order.shippingAddress.phone}
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  {order.shippingAddress.email}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? 'Free' : isIndia && shipping === 1.795 ? '₹149' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Payment Method</p>
              <div className="flex items-center space-x-2">
                {order.paymentMethod === 'cod' ? (
                  <>
                    <Banknote className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-600">Cash on Delivery</p>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-600">Card Payment</p>
                  </>
                )}
              </div>
            </div>
            {order.paymentIntentId && (
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Payment ID</p>
                <p className="text-sm font-mono break-all">{order.paymentIntentId}</p>
              </div>
            )}
            {order.trackingNumber && (
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                <p className="text-sm font-mono">{order.trackingNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerOrderDetailPage() {
  return (
    <SellerRoute>
      <SellerOrderDetailContent />
    </SellerRoute>
  );
}

