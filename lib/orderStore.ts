import { create } from 'zustand';
import { Order, CartItem, ShippingAddress } from '@/types';

interface OrderStore {
  orders: Order[];
  addOrder: (items: CartItem[], shippingAddress: ShippingAddress, total: number, paymentIntentId?: string, paymentMethod?: 'card' | 'cod' | 'upi') => Order;
  getOrderById: (orderId: string) => Order | undefined;
  getAllOrders: () => Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

// Simple localStorage persistence
const loadOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('orders');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders: Order[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('orders', JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders:', error);
  }
};

export const useOrderStore = create<OrderStore>((set, get) => {
  // Initialize with stored orders
  const initialOrders = loadOrders();
  
  return {
    orders: initialOrders,
    
    addOrder: (items, shippingAddress, total, paymentIntentId, paymentMethod: 'card' | 'cod' | 'upi' = 'card') => {
      const order: Order = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        items,
        shippingAddress,
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        paymentIntentId,
        paymentMethod,
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };
      
      const newOrders = [order, ...get().orders];
      set({ orders: newOrders });
      saveOrders(newOrders);
      
      return order;
    },
    
    getOrderById: (orderId) => {
      return get().orders.find(order => order.id === orderId);
    },
    
    getAllOrders: () => {
      return get().orders;
    },
    
    updateOrderStatus: (orderId, status) => {
      const orders = get().orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      set({ orders });
      saveOrders(orders);
    },
  };
});

