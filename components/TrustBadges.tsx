'use client';

import { Shield, Lock, Truck, RotateCcw, Award } from 'lucide-react';
import { useCurrencyStore } from '@/lib/currencyStore';

export default function TrustBadges() {
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  return (
    <section className="py-12 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">SSL Secured</p>
            <p className="text-xs text-gray-600">Safe Payments</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">100% Secure</p>
            <p className="text-xs text-gray-600">Encrypted Data</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Free Shipping</p>
            <p className="text-xs text-gray-600">Worldwide</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">7-Day Replacement</p>
            <p className="text-xs text-gray-600">Easy Exchange</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Premium Quality</p>
            <p className="text-xs text-gray-600">Authentic Products</p>
          </div>
        </div>
      </div>
    </section>
  );
}

