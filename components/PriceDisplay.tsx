'use client';

import { useCurrencyStore } from '@/lib/currencyStore';
import { Product } from '@/types';
import { useState, useEffect } from 'react';

interface PriceDisplayProps {
  product: Product; // Now accepts product instead of price
  className?: string;
  weight?: string;
  showDiscount?: boolean; // Whether to show discount badge and strikethrough
}

/**
 * Client-only price display component that shows fixed prices per currency.
 * Uses getPrice() to get the fixed price for the selected currency.
 * Supports discount display with original price strikethrough.
 */
export default function PriceDisplay({ product, className = '', weight, showDiscount = true }: PriceDisplayProps) {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const getPrice = useCurrencyStore((state) => state.getPrice);
  const getDiscountedPrice = useCurrencyStore((state) => state.getDiscountedPrice);
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get discounted price info
  const priceInfo = getDiscountedPrice(product);
  const formattedPrice = formatPrice(priceInfo.discounted);
  const formattedOriginal = formatPrice(priceInfo.original);

  // Use suppressHydrationWarning to prevent React from complaining about
  // server/client mismatch. The server renders with default currency (USD),
  // and the client will update to the user's selected currency after hydration.
  
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        ${product.price.toFixed(2)}
        {weight && <span className="text-gray-500 text-sm ml-2">/ {weight}</span>}
      </span>
    );
  }

  // If discount exists and showDiscount is true
  if (priceInfo.hasDiscount && showDiscount) {
    const discountPercent = product.discount?.type === 'percentage' 
      ? product.discount.value 
      : Math.round((priceInfo.discountAmount / priceInfo.original) * 100);
    
    return (
      <div className={className}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-red-600 font-bold">{formattedPrice}</span>
          <span className="text-gray-400 line-through text-sm">{formattedOriginal}</span>
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
            {discountPercent}% OFF
          </span>
        </div>
        {weight && <span className="text-gray-500 text-sm ml-2">/ {weight}</span>}
      </div>
    );
  }

  // No discount or showDiscount is false
  return (
    <span className={className} suppressHydrationWarning>
      {formattedPrice}
      {weight && <span className="text-gray-500 text-sm ml-2">/ {weight}</span>}
    </span>
  );
}

