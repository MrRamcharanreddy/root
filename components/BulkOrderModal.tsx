'use client';

import { useState, FormEvent } from 'react';
import { X, Package, Users, DollarSign, Mail, Phone, MessageSquare } from 'lucide-react';
import { Product } from '@/types';
import toast from 'react-hot-toast';
import Image from 'next/image';
import PriceDisplay from './PriceDisplay';
import { useCurrencyStore } from '@/lib/currencyStore';
import { logError } from '@/lib/errorTracking';

interface BulkOrderModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkOrderModal({ product, isOpen, onClose }: BulkOrderModalProps) {
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const [formData, setFormData] = useState({
    quantity: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Get valid quantity (default to 5 if empty or invalid, minimum 5kg)
  const getValidQuantity = (qty: string | number): number => {
    const num = typeof qty === 'string' ? parseInt(qty, 10) : qty;
    if (isNaN(num) || num < 5) return 5;
    return num;
  };

  const validQuantity = getValidQuantity(formData.quantity);

  // Calculate bulk pricing (10% discount for 5-10kg, 15% for 10-20kg, 20% for 20kg+)
  const getBulkDiscount = (quantity: number) => {
    if (quantity >= 20) return 0.20; // 20% off for 20+ Kg
    if (quantity >= 10) return 0.15; // 15% off for 10-20 Kg
    if (quantity >= 5) return 0.10; // 10% off for 5-10 Kg
    return 0;
  };

  const discount = getBulkDiscount(validQuantity);
  const originalPrice = product.price * validQuantity;
  const discountAmount = originalPrice * discount;
  const finalPrice = originalPrice - discountAmount;
  const pricePerUnit = product.price * (1 - discount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate quantity
    const qty = getValidQuantity(formData.quantity);
    if (qty < 5) {
      toast.error('Minimum order quantity is 5 Kg');
      return;
    }

    setLoading(true);

    try {
      // Submit bulk order inquiry
      const response = await fetch('/api/bulk-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          quantity: validQuantity,
          originalPrice: product.price,
          discount,
          finalPrice,
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            message: formData.message,
          },
        }),
      });

      // Safely parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        logError(parseError instanceof Error ? parseError : new Error('Failed to parse bulk order response'), {
          component: 'BulkOrderModal',
          productId: product.id,
        });
        toast.error('Failed to submit bulk order inquiry. Please try again.');
        return;
      }

      if (data?.success) {
        toast.success('Bulk order inquiry submitted! We&apos;ll contact you soon.');
        setFormData({
          quantity: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          message: '',
        });
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit bulk order inquiry');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Unknown bulk order error'), {
        component: 'BulkOrderModal',
        productId: product.id,
      });
      toast.error('Failed to submit bulk order inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Order</h2>
              <p className="text-sm text-gray-600">Get special pricing for large quantities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Regular Price: <PriceDisplay product={product} className="font-semibold" />
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Quantity</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{validQuantity} Kg</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Discount</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {discount > 0 ? `${(discount * 100).toFixed(0)}%` : '0%'}
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-900">Total Price</span>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(finalPrice)}
              </p>
            </div>
          </div>

          {/* Discount Tiers */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6 shadow-md">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
              Bulk Pricing Tiers
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">5-10 Kg</p>
                <p className="text-lg font-bold text-blue-600">10%</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border-2 border-primary-400 shadow-md">
                <p className="text-xs text-gray-600 mb-1">10-20 Kg</p>
                <p className="text-lg font-bold text-primary-600">15%</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">20+ Kg</p>
                <p className="text-lg font-bold text-purple-600">20%</p>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Your Price per Kg</p>
              <p className="text-xl font-bold text-primary-600">
                {formatPrice(pricePerUnit)}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity (in Kg) *
              </label>
              <input
                type="number"
                min="5"
                value={formData.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for clearing
                  if (value === '') {
                    setFormData({ ...formData, quantity: '' });
                  } else {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 0) {
                      setFormData({ ...formData, quantity: value });
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const num = parseInt(value, 10);
                  // If empty or less than 5, set to 5
                  if (value === '' || isNaN(num) || num < 5) {
                    setFormData({ ...formData, quantity: '5' });
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
                placeholder="Enter quantity in Kg (minimum 5)"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum order: 5 Kg</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Message (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Any special requirements or questions?"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Bulk Order Inquiry'}
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            We&apos;ll review your bulk order request and contact you within 24 hours with a quote and next steps.
          </p>
        </div>
      </div>
    </div>
  );
}

