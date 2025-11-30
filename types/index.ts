export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // USD price (default/fallback for backward compatibility)
  prices?: {
    [currencyCode: string]: number; // Fixed prices per currency (e.g., { USD: 4.99, INR: 399, EUR: 4.49 })
  };
  // Discount fields
  discount?: {
    type: 'percentage' | 'fixed'; // Type of discount
    value: number; // Discount value (percentage or fixed amount)
    currency?: string; // Currency for fixed discount (if not set, applies to all currencies)
  };
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  weight?: string;
  ingredients?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  rating?: number;
  reviewCount?: number;
  bestSeller?: boolean;
  newArrival?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string | Date; // Can be string (from API) or Date (from MongoDB)
  paymentIntentId?: string;
  paymentMethod?: 'card' | 'cod' | 'upi';
  trackingNumber?: string;
  estimatedDelivery?: string | Date; // Can be string (from API) or Date (from MongoDB)
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful?: number;
}

export type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'popular';

