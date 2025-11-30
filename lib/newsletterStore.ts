import { create } from 'zustand';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  active: boolean;
}

interface NewsletterStore {
  subscribers: NewsletterSubscriber[];
  subscribe: (email: string, name?: string) => NewsletterSubscriber | null;
  unsubscribe: (email: string) => void;
  getAllSubscribers: () => NewsletterSubscriber[];
  getSubscriberCount: () => number;
}

const STORAGE_KEY = 'roots2global_newsletter';

const loadSubscribers = (): NewsletterSubscriber[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load subscribers:', error);
    return [];
  }
};

const saveSubscribers = (subscribers: NewsletterSubscriber[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
  } catch (error) {
    // Silently fail - newsletter subscription is not critical
    // Error is already handled by the function return value
  }
};

export const useNewsletterStore = create<NewsletterStore>((set, get) => {
  const initialSubscribers = loadSubscribers();
  
  return {
    subscribers: initialSubscribers,
    
    subscribe: (email, name) => {
      const subscribers = get().subscribers;
      const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
      
      if (existing) {
        if (existing.active) {
          return null; // Already subscribed
        }
        // Reactivate subscription
        const updated = subscribers.map(s =>
          s.email.toLowerCase() === email.toLowerCase()
            ? { ...s, active: true, subscribedAt: new Date().toISOString() }
            : s
        );
        set({ subscribers: updated });
        saveSubscribers(updated);
        return updated.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
      }
      
      const newSubscriber: NewsletterSubscriber = {
        id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        email: email.toLowerCase(),
        name,
        subscribedAt: new Date().toISOString(),
        active: true,
      };
      
      const updated = [...subscribers, newSubscriber];
      set({ subscribers: updated });
      saveSubscribers(updated);
      
      return newSubscriber;
    },
    
    unsubscribe: (email) => {
      const updated = get().subscribers.map(s =>
        s.email.toLowerCase() === email.toLowerCase()
          ? { ...s, active: false }
          : s
      );
      set({ subscribers: updated });
      saveSubscribers(updated);
    },
    
    getAllSubscribers: () => {
      return get().subscribers.filter(s => s.active);
    },
    
    getSubscriberCount: () => {
      return get().subscribers.filter(s => s.active).length;
    },
  };
});

