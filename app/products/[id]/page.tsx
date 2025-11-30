'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useProductStore } from '@/lib/productStore';
import { useCartStore } from '@/lib/store';
import { useReviewStore } from '@/lib/reviewStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { useWishlistStore } from '@/lib/wishlistStore';
import { useRecentlyViewedStore } from '@/lib/recentlyViewedStore';
import ProductCard from '@/components/ProductCard';
import PriceDisplay from '@/components/PriceDisplay';
import { ShoppingCart, Minus, Plus, Package, Info, Star, Image as ImageIcon, Heart, MessageSquare, Eye, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';

// Lazy load heavy modal component
const BulkOrderModal = lazy(() => import('@/components/BulkOrderModal'));

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  const product = useProductStore((state) => state.getProductById(productId));
  const addItem = useCartStore((state) => state.addItem);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getReviewsByProductId, addReview, getAverageRating, getReviewCount } = useReviewStore();
  const { addProduct: addToRecentlyViewed, getRecentProducts } = useRecentlyViewedStore();
  const allProducts = useProductStore((state) => state.getAllProducts());
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const [imageLoading, setImageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track recently viewed
  useEffect(() => {
    if (product && mounted) {
      addToRecentlyViewed(product);
    }
  }, [product, mounted, addToRecentlyViewed]);

  // Get related products (same category, excluding current product)
  const relatedProducts = allProducts
    .filter(p => p.category === product?.category && p.id !== productId)
    .slice(0, 4);

  // Get recently viewed products (excluding current product)
  const recentlyViewed = getRecentProducts(4).filter(p => p.id !== productId);

  const reviews = getReviewsByProductId(productId);
  const averageRating = getAverageRating(productId);
  const reviewCount = getReviewCount(productId);
  const isWishlisted = mounted && isInWishlist(productId);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Link href="/products" className="text-primary-600 hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const images = product.images || [product.image];

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity} x ${product.name} added to cart!`);
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleWishlistToggle = () => {
    if (!currentUser) {
      toast.error('Please sign in to add items to wishlist');
      return;
    }
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const handleSubmitReview = () => {
    if (!currentUser) {
      toast.error('Please sign in to write a review');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }
    if (!product) return;

    addReview({
      productId: product.id,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });

    toast.success('Review submitted successfully!');
    setReviewComment('');
    setReviewRating(5);
    setShowReviewForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative h-96 w-full mb-4 rounded-lg overflow-hidden bg-gray-100">
            {imageErrors[selectedImage] ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="text-center p-4">
                  <ImageIcon className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Image unavailable</p>
                </div>
              </div>
            ) : (
              <>
                {imageLoading && selectedImage === 0 && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="text-gray-400">Loading...</div>
                  </div>
                )}
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className={`object-cover ${imageLoading && selectedImage === 0 ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                  priority={selectedImage === 0}
                  loading={selectedImage === 0 ? 'eager' : 'lazy'}
                  quality={90}
                  onError={() => handleImageError(selectedImage)}
                  onLoad={selectedImage === 0 ? handleImageLoad : undefined}
                />
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 bg-gray-100 ${
                    selectedImage === index ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  {imageErrors[index] ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  ) : (
                    <Image
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(index)}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.bestSeller && (
            <span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
              Best Seller
            </span>
          )}
          {product.newArrival && (
            <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 ml-2">
              New Arrival
            </span>
          )}
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating || product.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-300 text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-900 mr-2">
              {(averageRating || product.rating || 0).toFixed(1)}
            </span>
            <span className="text-gray-600">
              ({reviewCount || product.reviewCount || 0} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <div className="flex items-center mb-6">
            <PriceDisplay 
              product={product}
              weight={product.weight}
              className="text-4xl font-bold text-primary-600"
            />
          </div>

          <p className="text-gray-700 text-lg mb-6">{product.description}</p>

          {/* Stock Status */}
          <div className="mb-6">
            {product.inStock ? (
              <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                In Stock
              </span>
            ) : (
              <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="font-semibold">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <button
                onClick={decreaseQuantity}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-6 py-2 font-semibold">{quantity}</span>
              <button
                onClick={increaseQuantity}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              {mounted && currentUser && (
                <button
                  onClick={handleWishlistToggle}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isWishlisted
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 hover:border-primary-600 text-gray-700'
                  }`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowBulkOrderModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center space-x-2 shadow-md"
            >
              <Users className="w-5 h-5" />
              <span>Bulk Order</span>
            </button>
          </div>

          {/* Product Details */}
          <div className="border-t pt-6 space-y-4">
            {product.category && (
              <div className="flex items-start">
                <Package className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <span className="font-semibold">Category: </span>
                  <span className="text-gray-700">{product.category}</span>
                </div>
              </div>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <div className="flex items-start">
                <Info className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <span className="font-semibold">Ingredients: </span>
                  <span className="text-gray-700">{product.ingredients.join(', ')}</span>
                </div>
              </div>
            )}

            {product.nutritionalInfo && (
              <div className="flex items-start">
                <Info className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <span className="font-semibold">Nutritional Info (per 100g): </span>
                  <div className="text-gray-700 mt-1">
                    {product.nutritionalInfo.calories && (
                      <span>Calories: {product.nutritionalInfo.calories} | </span>
                    )}
                    {product.nutritionalInfo.protein && (
                      <span>Protein: {product.nutritionalInfo.protein}g | </span>
                    )}
                    {product.nutritionalInfo.carbs && (
                      <span>Carbs: {product.nutritionalInfo.carbs}g | </span>
                    )}
                    {product.nutritionalInfo.fat && (
                      <span>Fat: {product.nutritionalInfo.fat}g</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Customer Reviews</h2>
            <p className="text-gray-600">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>
          {currentUser && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Write a Review</span>
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4">Write Your Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Rating</label>
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        i < reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-300 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-gray-600">{reviewRating} out of 5</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Your Review</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                rows={4}
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSubmitReview}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewComment('');
                  setReviewRating(5);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{review.userName}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No reviews yet</p>
            <p className="text-gray-500">
              {currentUser
                ? 'Be the first to review this product!'
                : 'Sign in to write a review'}
            </p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Eye className="w-8 h-8 mr-2 text-primary-600" />
              Recently Viewed
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recentlyViewed.map((viewedProduct) => (
              <ProductCard key={viewedProduct.id} product={viewedProduct} />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Order Modal */}
      {product && (
        <Suspense fallback={null}>
          <BulkOrderModal
            product={product}
            isOpen={showBulkOrderModal}
            onClose={() => setShowBulkOrderModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

