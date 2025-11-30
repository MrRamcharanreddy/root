/**
 * API Client Utilities
 * Handles all API calls to the backend database
 */

import { logError } from '@/lib/errorTracking';
import { Product, Order, CartItem, ShippingAddress } from '@/types';

/**
 * User data structure returned from API
 */
export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user ID if available
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('current-user');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          headers['x-user-id'] = user.id;
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Add seller status if available
      const isSeller = localStorage.getItem('seller-auth') === 'true';
      if (isSeller) {
        headers['x-is-seller'] = 'true';
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      // Safely parse JSON response
      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // If response is not JSON, try to parse as text
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        }
      } catch (parseError) {
        // If JSON parsing fails, return error
        throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      logError(error instanceof Error ? error : new Error('API request failed'), {
        endpoint,
        method: options.method || 'GET',
        errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Authentication
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    return this.request<{ user: UserData }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: UserData }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Orders
  async getOrders() {
    return this.request<Order[]>('/orders');
  }

  async getOrderById(orderId: string) {
    return this.request<Order>(`/orders/${orderId}`);
  }

  async createOrder(orderData: {
    items: CartItem[];
    shippingAddress: ShippingAddress;
    total: number;
    paymentIntentId?: string;
    paymentMethod?: 'card' | 'cod' | 'upi';
  }) {
    return this.request<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    return this.request<{ order: Order }>(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Products
  async getProducts(params?: { category?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<Product[]>(`/products${query ? `?${query}` : ''}`);
  }

  async createProduct(productData: Partial<Product>) {
    return this.request<{ product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }
}

export const apiClient = new ApiClient();

