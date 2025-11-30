import { create } from 'zustand';
import { Product } from '@/types';
import { products as initialProducts } from '@/data/products';

interface ProductStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getAllProducts: () => Product[];
}

// Load from localStorage
const loadProducts = (): Product[] => {
  if (typeof window === 'undefined') return initialProducts;
  try {
    const stored = localStorage.getItem('products');
    if (stored) {
      return JSON.parse(stored);
    }
    return initialProducts;
  } catch {
    return initialProducts;
  }
};

// Save to localStorage
const saveProducts = (products: Product[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('products', JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products:', error);
  }
};

export const useProductStore = create<ProductStore>((set, get) => {
  // Initialize with default products (not from localStorage to avoid hydration issues)
  // Load from localStorage only on client-side via useEffect
  return {
    products: initialProducts,
    
    addProduct: (productData) => {
      const newProduct: Product = {
        ...productData,
        id: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };
      
      const updatedProducts = [...get().products, newProduct];
      set({ products: updatedProducts });
      saveProducts(updatedProducts);
      
      return newProduct;
    },
    
    updateProduct: (id, updates) => {
      const updatedProducts = get().products.map(product =>
        product.id === id ? { ...product, ...updates } : product
      );
      set({ products: updatedProducts });
      saveProducts(updatedProducts);
    },
    
    deleteProduct: (id) => {
      const updatedProducts = get().products.filter(product => product.id !== id);
      set({ products: updatedProducts });
      saveProducts(updatedProducts);
    },
    
    getProductById: (id) => {
      return get().products.find(product => product.id === id);
    },
    
    getAllProducts: () => {
      return get().products;
    },
  };
});

// Sync with localStorage on client-side only (after hydration)
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after React hydration
  setTimeout(() => {
    const storedProducts = loadProducts();
    // Only update if localStorage has products and they're different from initial
    if (storedProducts.length > 0 && JSON.stringify(storedProducts) !== JSON.stringify(initialProducts)) {
      useProductStore.setState({ products: storedProducts });
    }
  }, 0);
}

