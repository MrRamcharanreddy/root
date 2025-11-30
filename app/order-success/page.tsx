'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const orderId = searchParams.get('order_id');
  const paymentMethod = searchParams.get('payment_method');
  const isCOD = paymentMethod === 'cod';
  const isUPI = paymentMethod === 'upi';
  const isPrepaid = paymentMethod === 'card' || paymentMethod === 'upi';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 text-lg mb-8">
          {isCOD 
            ? 'Thank you for your order! Your order has been placed and will be delivered soon. Please have cash ready for payment upon delivery.'
            : 'Thank you for your purchase. Your order has been successfully placed.'
          }
        </p>

        {(orderId || paymentIntentId) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            {orderId && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Order Number:</p>
                <p className="font-mono text-lg font-bold break-all">{orderId}</p>
              </div>
            )}
            {(isCOD || isUPI) && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Payment Method:</p>
                <p className="font-semibold text-lg text-primary-600">
                  {isCOD ? 'Cash on Delivery' : isUPI ? 'UPI Payment' : 'Card Payment'}
                </p>
              </div>
            )}
            {paymentIntentId && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Payment ID:</p>
                <p className="font-mono text-sm break-all">{paymentIntentId}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Mail className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold">What&apos;s Next?</h2>
          </div>
          <p className="text-gray-700 mb-4">
            {isCOD 
              ? 'You will receive an email confirmation with your order details. Please have cash ready when the delivery arrives.'
              : isUPI
              ? 'You will receive an email confirmation with your order details. Please complete the UPI payment to confirm your order. Note: UPI payment does not require QR code scanning - you will enter your UPI ID or select your preferred UPI app.'
              : 'You will receive an email confirmation with your order details and tracking information once your order ships.'
            }
          </p>
          <p className="text-gray-700">
            {isCOD
              ? 'We typically process and deliver orders within 5-7 business days.'
              : 'We typically process and ship orders within 2-3 business days.'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              View Order Details
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          )}
          <Link
            href="/products"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}

