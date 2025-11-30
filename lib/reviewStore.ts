import { create } from 'zustand';
import { Review } from '@/types';

interface ReviewStore {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Review;
  getReviewsByProductId: (productId: string) => Review[];
  getAverageRating: (productId: string) => number;
  getReviewCount: (productId: string) => number;
  deleteReview: (reviewId: string) => void;
}

const STORAGE_KEY = 'roots2global_reviews';

const loadReviews = (): Review[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load reviews:', error);
    return [];
  }
};

const saveReviews = (reviews: Review[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.error('Failed to save reviews:', error);
  }
};

export const useReviewStore = create<ReviewStore>((set, get) => {
  const initialReviews = loadReviews();
  
  return {
    reviews: initialReviews,
    
    addReview: (reviewData) => {
      const newReview: Review = {
        ...reviewData,
        id: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        helpful: 0,
      };
      
      const updatedReviews = [...get().reviews, newReview];
      set({ reviews: updatedReviews });
      saveReviews(updatedReviews);
      
      return newReview;
    },
    
    getReviewsByProductId: (productId) => {
      return get().reviews.filter(review => review.productId === productId);
    },
    
    getAverageRating: (productId) => {
      const productReviews = get().reviews.filter(review => review.productId === productId);
      if (productReviews.length === 0) return 0;
      const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
      return Math.round((sum / productReviews.length) * 10) / 10;
    },
    
    getReviewCount: (productId) => {
      return get().reviews.filter(review => review.productId === productId).length;
    },
    
    deleteReview: (reviewId) => {
      const updatedReviews = get().reviews.filter(review => review.id !== reviewId);
      set({ reviews: updatedReviews });
      saveReviews(updatedReviews);
    },
  };
});

