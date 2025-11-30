'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCartStore } from '@/lib/store';
import { useWishlistStore } from '@/lib/wishlistStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { ShoppingCart, Star, Image as ImageIcon, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback, memo, MouseEvent } from 'react';
import PriceDisplay from '@/components/PriceDisplay';

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  }, [product, addItem]);

  const handleWishlistToggle = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please sign in to add items to wishlist');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  }, [currentUser, isWishlisted, product, addToWishlist, removeFromWishlist]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center p-4">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Image unavailable</p>
              </div>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
              <Image
                src={product.image}
                alt={product.name}
                fill
                className={`object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={handleImageError}
                onLoad={handleImageLoad}
                priority={false}
                loading="lazy"
                quality={85}
              />
            </>
          )}
          {product.bestSeller && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
              Best Seller
            </div>
          )}
          {product.newArrival && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
              New
            </div>
          )}
          {!product.inStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
              Out of Stock
            </div>
          )}
          {mounted && currentUser && (
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-2 right-2 p-2 rounded-full shadow-lg z-10 transition-colors ${
                isWishlisted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </Link>
      <div className="p-4 flex-grow flex flex-col">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-xl font-semibold mb-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.rating && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-300 text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {product.rating.toFixed(1)}
            </span>
            {product.reviewCount && (
              <span className="text-sm text-gray-500">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <PriceDisplay 
              product={product}
              weight={product.weight}
              className="text-2xl font-bold text-primary-600"
            />
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);

