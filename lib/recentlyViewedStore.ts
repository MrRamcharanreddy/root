import { create } from 'zustand';
import { Product } from '@/types';

interface RecentlyViewedStore {
  items: Product[];
  addProduct: (product: Product) => void;
  getRecentProducts: (limit?: number) => Product[];
  clearHistory: () => void;
}

const STORAGE_KEY = 'roots2global_recently_viewed';
const MAX_ITEMS = 20;

const loadRecentlyViewed = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load recently viewed:', error);
    return [];
  }
};

const saveRecentlyViewed = (items: Product[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save recently viewed:', error);
  }
};

export const useRecentlyViewedStore = create<RecentlyViewedStore>((set, get) => {
  const initialItems = loadRecentlyViewed();
  
  return {
    items: initialItems,
    
    addProduct: (product) => {
      const items = get().items;
      // Remove if already exists
      const filtered = items.filter(item => item.id !== product.id);
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      set({ items: updated });
      saveRecentlyViewed(updated);
    },
    
    getRecentProducts: (limit = 4) => {
      return get().items.slice(0, limit);
    },
    
    clearHistory: () => {
      set({ items: [] });
      saveRecentlyViewed([]);
    },
  };
});

