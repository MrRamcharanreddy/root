import { create } from 'zustand';
import { Product } from '@/types';

interface WishlistStore {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getWishlistCount: () => number;
}

const STORAGE_KEY = 'roots2global_wishlist';

const loadWishlist = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load wishlist:', error);
    return [];
  }
};

const saveWishlist = (items: Product[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save wishlist:', error);
  }
};

export const useWishlistStore = create<WishlistStore>((set, get) => {
  const initialItems = loadWishlist();
  
  return {
    items: initialItems,
    
    addToWishlist: (product) => {
      const items = get().items;
      if (!items.find(item => item.id === product.id)) {
        const updatedItems = [...items, product];
        set({ items: updatedItems });
        saveWishlist(updatedItems);
      }
    },
    
    removeFromWishlist: (productId) => {
      const updatedItems = get().items.filter(item => item.id !== productId);
      set({ items: updatedItems });
      saveWishlist(updatedItems);
    },
    
    isInWishlist: (productId) => {
      return get().items.some(item => item.id === productId);
    },
    
    clearWishlist: () => {
      set({ items: [] });
      saveWishlist([]);
    },
    
    getWishlistCount: () => {
      return get().items.length;
    },
  };
});

