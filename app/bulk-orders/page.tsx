'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Package, Users, DollarSign, Mail, Phone, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { useProductStore } from '@/lib/productStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logWarning } from '@/lib/errorTracking';

// Lazy load heavy modal component
const BulkOrderModal = lazy(() => import('@/components/BulkOrderModal'));

export default function BulkOrdersPage() {
  const router = useRouter();
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const [mounted, setMounted] = useState(false);
  const products = useProductStore((state) => state.getAllProducts());
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // CRITICAL SECURITY FIX: Validate user data on mount to prevent URL sharing issues
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('current-user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // If currentUser doesn't match stored user, clear everything
          if (currentUser && currentUser.email !== parsedUser.email) {
            logWarning('User mismatch detected on bulk-orders page! Clearing data for security.', {
              path: '/bulk-orders',
              currentUserEmail: currentUser.email,
              storedUserEmail: parsedUser.email,
            });
            // Clear all user data
            localStorage.removeItem('current-user');
            localStorage.removeItem('orders');
            localStorage.removeItem('saved-addresses');
            localStorage.removeItem('cart');
            // Force logout and redirect
            window.location.href = '/login';
            return;
          }
        } catch (e) {
          // Invalid stored user data, clear it
          localStorage.removeItem('current-user');
        }
      }
    }
  }, [currentUser]);

  const handleBulkOrder = (productId: string) => {
    setSelectedProduct(productId);
    setShowModal(true);
  };

  const selectedProductData = selectedProduct
    ? products.find((p) => p.id === selectedProduct)
    : null;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Bulk Orders</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get special pricing for large quantity orders. Perfect for retailers, distributors, and businesses.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Volume Discounts</h3>
          <p className="text-gray-600 text-sm">
            Save up to 20% on large orders. The more you order, the more you save.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Fast Processing</h3>
          <p className="text-gray-600 text-sm">
            Priority handling for bulk orders. Quick quotes and fast delivery.
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Custom Solutions</h3>
          <p className="text-gray-600 text-sm">
            Tailored packaging, labeling, and shipping options for your business needs.
          </p>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 mb-12 shadow-lg">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
            Bulk Pricing Tiers
          </h2>
          <p className="text-gray-600 text-lg">Choose the perfect plan for your business needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Tier 1: 5-10 Kg */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-blue-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full mb-4 shadow-md">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-bold text-lg">5-10 Kg</span>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-extrabold text-gray-900">10%</span>
                <span className="text-2xl font-bold text-gray-600 ml-1">OFF</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Volume Discount</p>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Volume discount applied</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Standard shipping included</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Fast order processing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tier 2: 10-20 Kg - Featured */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 border-4 border-primary-400 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              POPULAR
            </div>
            <div className="text-center mb-6 text-white">
              <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-4 shadow-lg">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-bold text-lg">10-20 Kg</span>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-extrabold text-white">15%</span>
                <span className="text-2xl font-bold text-primary-100 ml-1">OFF</span>
              </div>
              <p className="text-sm text-primary-100 mt-1">Higher Volume Discount</p>
            </div>
            <div className="border-t border-white/30 pt-6">
              <ul className="space-y-3 text-sm text-white">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Higher volume discount</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority shipping & handling</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Dedicated support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tier 3: 20+ Kg */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-purple-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-white px-6 py-3 rounded-full mb-4 shadow-md">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-bold text-lg">20+ Kg</span>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-extrabold text-gray-900">20%</span>
                <span className="text-2xl font-bold text-gray-600 ml-1">OFF</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Maximum Discount</p>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Maximum discount rate</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom packaging options</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Premium support & consultation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Available for Bulk Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-4">{product.category}</p>
                <button
                  onClick={() => handleBulkOrder(product.id)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Request Bulk Order</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Place a Bulk Order?</h2>
        <p className="text-xl mb-6 text-primary-100">
          Contact us for custom pricing, special requirements, or questions about bulk orders.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
          >
            <Mail className="w-5 h-5" />
            <span>Contact Us</span>
          </Link>
          <Link
            href="/products"
            className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors flex items-center justify-center space-x-2 border-2 border-white"
          >
            <Package className="w-5 h-5" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>

      {/* Bulk Order Modal */}
      {selectedProductData && (
        <Suspense fallback={null}>
          <BulkOrderModal
            product={selectedProductData}
            isOpen={showModal}
            onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          />
        </Suspense>
      )}
    </div>
  );
}

