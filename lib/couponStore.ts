import { create } from 'zustand';

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
}

interface CouponStore {
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'usedCount'>) => Coupon;
  validateCoupon: (code: string, total: number) => { valid: boolean; discount: number; coupon?: Coupon; error?: string };
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  activeCoupon: Coupon | null;
  updateCoupon: (code: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;
  getAllCoupons: () => Coupon[];
}

const STORAGE_KEY = 'roots2global_coupons';
const ACTIVE_COUPON_KEY = 'roots2global_active_coupon';

const loadCoupons = (): Coupon[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load coupons:', error);
    return [];
  }
};

const saveCoupons = (coupons: Coupon[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch (error) {
    console.error('Failed to save coupons:', error);
  }
};

const loadActiveCoupon = (): Coupon | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ACTIVE_COUPON_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveActiveCoupon = (coupon: Coupon | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (coupon) {
      localStorage.setItem(ACTIVE_COUPON_KEY, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(ACTIVE_COUPON_KEY);
    }
  } catch (error) {
    console.error('Failed to save active coupon:', error);
  }
};

// Default coupons
const defaultCoupons: Coupon[] = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    validFrom: new Date(2024, 0, 1).toISOString(),
    validUntil: new Date(2025, 11, 31).toISOString(),
    usageLimit: 1000,
    usedCount: 0,
    active: true,
  },
  {
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 50,
    validFrom: new Date(2024, 0, 1).toISOString(),
    validUntil: new Date(2025, 11, 31).toISOString(),
    usageLimit: 500,
    usedCount: 0,
    active: true,
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 5,
    minPurchase: 30,
    validFrom: new Date(2024, 0, 1).toISOString(),
    validUntil: new Date(2025, 11, 31).toISOString(),
    usageLimit: 1000,
    usedCount: 0,
    active: true,
  },
];

export const useCouponStore = create<CouponStore>((set, get) => {
  const initialCoupons = loadCoupons();
  const coupons = initialCoupons.length > 0 ? initialCoupons : defaultCoupons;
  if (initialCoupons.length === 0) {
    saveCoupons(coupons);
  }
  
  return {
    coupons,
    activeCoupon: loadActiveCoupon(),
    
    addCoupon: (couponData) => {
      const newCoupon: Coupon = {
        ...couponData,
        usedCount: 0,
      };
      
      const updatedCoupons = [...get().coupons, newCoupon];
      set({ coupons: updatedCoupons });
      saveCoupons(updatedCoupons);
      
      return newCoupon;
    },
    
    validateCoupon: (code, total) => {
      const coupon = get().coupons.find(
        c => c.code.toUpperCase() === code.toUpperCase() && c.active
      );
      
      if (!coupon) {
        return { valid: false, discount: 0, error: 'Invalid coupon code' };
      }
      
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);
      
      if (now < validFrom) {
        return { valid: false, discount: 0, error: 'Coupon not yet valid' };
      }
      
      if (now > validUntil) {
        return { valid: false, discount: 0, error: 'Coupon has expired' };
      }
      
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, discount: 0, error: 'Coupon usage limit reached' };
      }
      
      if (coupon.minPurchase && total < coupon.minPurchase) {
        return {
          valid: false,
          discount: 0,
          error: `Minimum purchase of $${coupon.minPurchase} required`,
        };
      }
      
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (total * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }
      
      return { valid: true, discount, coupon };
    },
    
    applyCoupon: (code) => {
      const total = 0; // Will be calculated in checkout
      const validation = get().validateCoupon(code, total);
      if (validation.valid && validation.coupon) {
        set({ activeCoupon: validation.coupon });
        saveActiveCoupon(validation.coupon);
      }
    },
    
    removeCoupon: () => {
      set({ activeCoupon: null });
      saveActiveCoupon(null);
    },
    
    updateCoupon: (code, updates) => {
      const updatedCoupons = get().coupons.map(coupon =>
        coupon.code.toUpperCase() === code.toUpperCase() ? { ...coupon, ...updates } : coupon
      );
      set({ coupons: updatedCoupons });
      saveCoupons(updatedCoupons);
    },
    
    deleteCoupon: (code) => {
      const updatedCoupons = get().coupons.filter(
        coupon => coupon.code.toUpperCase() !== code.toUpperCase()
      );
      set({ coupons: updatedCoupons });
      saveCoupons(updatedCoupons);
    },
    
    getAllCoupons: () => {
      return get().coupons;
    },
  };
});

