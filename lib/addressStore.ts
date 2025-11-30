import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShippingAddress } from '@/types';

export interface SavedAddress extends ShippingAddress {
  id: string;
  label?: string; // e.g., "Home", "Work", "Office"
  isDefault?: boolean;
  createdAt: string;
  userEmail: string; // User-specific: email of the user who owns this address
}

interface AddressStore {
  savedAddresses: SavedAddress[];
  addAddress: (address: ShippingAddress, userEmail: string, label?: string) => void;
  removeAddress: (id: string, userEmail: string) => void;
  updateAddress: (id: string, userEmail: string, updates: Partial<SavedAddress>) => void;
  setDefaultAddress: (id: string, userEmail: string) => void;
  getDefaultAddress: (userEmail: string) => SavedAddress | null;
  getUserAddresses: (userEmail: string) => SavedAddress[];
  extractAddressesFromOrders: (orders: any[], userEmail: string) => void;
}

// Helper function to check if two addresses are the same
const areAddressesEqual = (addr1: ShippingAddress, addr2: ShippingAddress): boolean => {
  return (
    addr1.firstName === addr2.firstName &&
    addr1.lastName === addr2.lastName &&
    addr1.email === addr2.email &&
    addr1.phone === addr2.phone &&
    addr1.address === addr2.address &&
    addr1.city === addr2.city &&
    addr1.state === addr2.state &&
    addr1.zipCode === addr2.zipCode &&
    addr1.country === addr2.country
  );
};

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      savedAddresses: [],

      addAddress: (address: ShippingAddress, userEmail: string, label?: string) => {
        if (!userEmail) {
          console.warn('Cannot add address: user email is required');
          return;
        }

        const allAddresses = get().savedAddresses;
        const userAddresses = allAddresses.filter(addr => addr.userEmail === userEmail);
        
        // Check if address already exists for this user
        const exists = userAddresses.some(addr => areAddressesEqual(addr, address));
        if (exists) {
          return; // Don't add duplicate
        }

        const newAddress: SavedAddress = {
          ...address,
          id: `ADDR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: label || 'Home',
          isDefault: userAddresses.length === 0, // First address for this user is default
          createdAt: new Date().toISOString(),
          userEmail: userEmail.toLowerCase(), // Store email in lowercase for consistency
        };

        // If this is set as default, unset other defaults for this user
        if (newAddress.isDefault) {
          const updatedAddresses = allAddresses.map(addr => 
            addr.userEmail === userEmail ? { ...addr, isDefault: false } : addr
          );
          set({ savedAddresses: [...updatedAddresses, newAddress] });
        } else {
          set({ savedAddresses: [...allAddresses, newAddress] });
        }
      },

      removeAddress: (id: string, userEmail: string) => {
        if (!userEmail) {
          console.warn('Cannot remove address: user email is required');
          return;
        }

        const allAddresses = get().savedAddresses;
        const addressToRemove = allAddresses.find(addr => addr.id === id && addr.userEmail === userEmail.toLowerCase());
        
        if (!addressToRemove) {
          return; // Address not found or doesn't belong to user
        }

        const filtered = allAddresses.filter(addr => addr.id !== id);
        
        // If we removed the default and there are other addresses for this user, set first as default
        const removedWasDefault = addressToRemove.isDefault;
        if (removedWasDefault) {
          const userAddresses = filtered.filter(addr => addr.userEmail === userEmail.toLowerCase());
          if (userAddresses.length > 0) {
            userAddresses[0].isDefault = true;
            const updated = allAddresses.map(addr => 
              addr.id === userAddresses[0].id ? { ...addr, isDefault: true } : addr
            ).filter(addr => addr.id !== id);
            set({ savedAddresses: updated });
            return;
          }
        }
        
        set({ savedAddresses: filtered });
      },

      updateAddress: (id: string, userEmail: string, updates: Partial<SavedAddress>) => {
        if (!userEmail) {
          console.warn('Cannot update address: user email is required');
          return;
        }

        const allAddresses = get().savedAddresses;
        const updated = allAddresses.map(addr =>
          addr.id === id && addr.userEmail === userEmail.toLowerCase() 
            ? { ...addr, ...updates } 
            : addr
        );
        set({ savedAddresses: updated });
      },

      setDefaultAddress: (id: string, userEmail: string) => {
        if (!userEmail) {
          console.warn('Cannot set default address: user email is required');
          return;
        }

        const allAddresses = get().savedAddresses;
        const updated = allAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === id && addr.userEmail === userEmail.toLowerCase(),
        }));
        set({ savedAddresses: updated });
      },

      getDefaultAddress: (userEmail: string) => {
        if (!userEmail) {
          return null;
        }

        const allAddresses = get().savedAddresses;
        const userAddresses = allAddresses.filter(addr => addr.userEmail === userEmail.toLowerCase());
        return userAddresses.find(addr => addr.isDefault) || userAddresses[0] || null;
      },

      getUserAddresses: (userEmail: string) => {
        if (!userEmail) {
          return [];
        }

        const allAddresses = get().savedAddresses;
        return allAddresses.filter(addr => addr.userEmail === userEmail.toLowerCase());
      },

      extractAddressesFromOrders: (orders: any[], userEmail: string) => {
        if (!userEmail) {
          console.warn('Cannot extract addresses: user email is required');
          return;
        }

        // Filter orders by user email
        const userOrders = orders.filter(order => {
          // Check if order belongs to current user by email
          return order.shippingAddress?.email?.toLowerCase() === userEmail.toLowerCase();
        });

        if (userOrders.length === 0) {
          return; // No orders for this user
        }

        const allAddresses = get().savedAddresses;
        const userAddresses = allAddresses.filter(addr => addr.userEmail === userEmail.toLowerCase());
        const existingAddressStrings = new Set(
          userAddresses.map(addr => JSON.stringify({
            firstName: addr.firstName,
            lastName: addr.lastName,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
          }))
        );

        // Extract unique addresses from user's orders
        const newAddresses: SavedAddress[] = [];
        userOrders.forEach(order => {
          if (order.shippingAddress && order.shippingAddress.email?.toLowerCase() === userEmail.toLowerCase()) {
            const addrString = JSON.stringify({
              firstName: order.shippingAddress.firstName,
              lastName: order.shippingAddress.lastName,
              address: order.shippingAddress.address,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              zipCode: order.shippingAddress.zipCode,
              country: order.shippingAddress.country,
            });

            if (!existingAddressStrings.has(addrString)) {
              existingAddressStrings.add(addrString);
              newAddresses.push({
                ...order.shippingAddress,
                id: `ADDR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                label: 'Previous Order',
                isDefault: false,
                createdAt: order.createdAt || new Date().toISOString(),
                userEmail: userEmail.toLowerCase(),
              });
            }
          }
        });

        if (newAddresses.length > 0) {
          set({ savedAddresses: [...allAddresses, ...newAddresses] });
        }
      },
    }),
    {
      name: 'saved-addresses',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

