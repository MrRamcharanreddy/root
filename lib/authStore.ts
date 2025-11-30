import { create } from 'zustand';

interface AuthStore {
  isSeller: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Check authentication status from server
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/seller/login', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.authenticated === true;
    }
    return false;
  } catch (error) {
    console.error('Failed to check auth status:', error);
    return false;
  }
};

export const useAuthStore = create<AuthStore>((set, get) => {
  // Initialize - check auth status on mount
  let initialIsSeller = false;
  
  // Check authentication status from server on initialization
  if (typeof window !== 'undefined') {
    // Check if a buyer is logged in - if so, clear seller auth
    const currentUser = localStorage.getItem('current-user');
    if (currentUser) {
      // Buyer is logged in - seller cannot be authenticated
      initialIsSeller = false;
    } else {
      // Check server-side authentication
      checkAuthStatus().then((isAuthenticated) => {
        set({ isSeller: isAuthenticated });
      });
    }
  }
  
  return {
    isSeller: initialIsSeller,
    
    login: async (password: string) => {
      try {
        const response = await fetch('/api/seller/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies
          body: JSON.stringify({ password }),
        });

        const data = await response.json();
      
        if (data.success) {
        // Clear buyer auth when seller logs in (to prevent conflicts)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('current-user');
        }
          // Set seller state immediately
          set({ isSeller: true });
          // Verify the auth was set correctly by checking again
          await new Promise(resolve => setTimeout(resolve, 50));
          const verified = await checkAuthStatus();
          if (verified) {
        set({ isSeller: true });
          }
        return { success: true };
      }
      
        return { success: false, error: data.error || 'Invalid password' };
      } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, error: 'Failed to login. Please try again.' };
      }
    },
    
    logout: async () => {
      try {
        await fetch('/api/seller/logout', {
          method: 'POST',
          credentials: 'include', // Include cookies
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
      set({ isSeller: false });
      // Clear buyer auth when seller logs out (to prevent conflicts)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current-user');
      }
      }
    },

    checkAuth: async () => {
      const isAuthenticated = await checkAuthStatus();
      set({ isSeller: isAuthenticated });
    },
  };
});

