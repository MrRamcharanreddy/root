'use client';

import { useCartStore } from '@/lib/store';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { useCurrencyStore } from '@/lib/currencyStore';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, Image as ImageIcon, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

function CartItemImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setImageError(true)}
    />
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalItems, clearCart } = useCartStore();
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const getDiscountedPrice = useCurrencyStore((state) => state.getDiscountedPrice);
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering cart content after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some delicious snacks to get started!</p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total using fixed currency prices (no conversion)
  const totalItems = getTotalItems();
  const total = items.reduce((sum, item) => {
    const priceInfo = getDiscountedPrice(item);
    return sum + (priceInfo.discounted * item.quantity);
  }, 0);
  
  // Check if user is in India (based on currency selection)
  const isIndia = selectedCurrency === 'INR';
  // Free shipping when buying 2 or more items together (based on total quantity)
  // India: ₹149, Other countries: $9.99
  const baseShipping = isIndia ? 149 : 9.99;
  const shipping = totalItems >= 2 ? 0 : baseShipping;
  const finalTotal = total + shipping;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-4"
            >
              <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <CartItemImage src={item.image} alt={item.name} />
              </div>
              <div className="flex-grow">
                <Link href={`/products/${item.id}`}>
                  <h3 className="text-xl font-semibold mb-2 hover:text-primary-600 transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <div className="mb-4">
                  {(() => {
                    const priceInfo = getDiscountedPrice(item);
                    if (priceInfo.hasDiscount) {
                      const discountPercent = item.discount?.type === 'percentage' 
                        ? item.discount.value 
                        : Math.round((priceInfo.discountAmount / priceInfo.original) * 100);
                      return (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-600">{formatPrice(priceInfo.discounted)} each</span>
                          <span className="text-gray-400 line-through text-sm">{formatPrice(priceInfo.original)}</span>
                          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                            {discountPercent}% OFF
                          </span>
                        </div>
                      );
                    }
                    return <p className="text-gray-600">{formatPrice(priceInfo.discounted)} each</p>;
                  })()}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xl font-bold">
                      {(() => {
                        const priceInfo = getDiscountedPrice(item);
                        return formatPrice(priceInfo.discounted * item.quantity);
                      })()}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span>{formatPrice(shipping)}</span>
                )}
                </span>
              </div>
              {totalItems < 2 && (
                <p className="text-sm text-gray-600">
                  Add {2 - totalItems} more item{2 - totalItems > 1 ? 's' : ''} for free shipping!
                </p>
              )}
              <div className="border-t pt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
            {currentUser ? (
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors mb-4"
              >
                Proceed to Checkout
              </button>
            ) : (
              <Link
                href="/login?return=/cart"
                className="w-full bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors mb-4 flex items-center justify-center space-x-2"
              >
                <Lock className="w-5 h-5" />
                <span>Sign In to Checkout</span>
              </Link>
            )}
            <Link
              href="/products"
              className="block text-center text-primary-600 hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

