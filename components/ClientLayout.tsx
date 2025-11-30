'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useVisitorStore } from '@/lib/visitorStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { useCurrencyStore } from '@/lib/currencyStore';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logWarning } from '@/lib/errorTracking';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { trackVisit, trackPageView } = useVisitorStore();
  const pathname = usePathname();
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const logout = useUserAuthStore((state) => state.logout);
  const fetchExchangeRates = useCurrencyStore((state) => state.fetchExchangeRates);

  useEffect(() => {
    // Track visit when component mounts
    trackVisit();
    // Fetch exchange rates on app load for currency conversion
    fetchExchangeRates();
  }, [trackVisit, fetchExchangeRates]);

  useEffect(() => {
    // Track page view on route change
    trackPageView();
  }, [pathname, trackPageView]);

  // CRITICAL SECURITY FIX: Validate and restore user session on every page load
  // This prevents auto-login when URL is shared but restores valid sessions
  const restoreSession = useUserAuthStore((state) => state.restoreSession);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedUser = localStorage.getItem('current-user');
    const sessionTimestamp = localStorage.getItem('user-session-timestamp');
    
    // Validate session timestamp
    if (sessionTimestamp) {
      const timestamp = parseInt(sessionTimestamp, 10);
      const now = Date.now();
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      if (isNaN(timestamp) || (now - timestamp) > SESSION_DURATION) {
        // Session expired, clear everything
        logWarning('Session expired! Clearing user data for security.', {
          path: pathname,
        });
        logout();
        localStorage.removeItem('current-user');
        localStorage.removeItem('user-session-timestamp');
        localStorage.removeItem('orders');
        localStorage.removeItem('saved-addresses');
        localStorage.removeItem('cart');
        return;
      }
    } else if (storedUser) {
      // Has user but no timestamp (old format or invalid), clear for security
      logWarning('Invalid session format! Clearing user data for security.', {
        path: pathname,
      });
      logout();
      localStorage.removeItem('current-user');
      localStorage.removeItem('orders');
      localStorage.removeItem('saved-addresses');
      localStorage.removeItem('cart');
      return;
    }
    
    // If there's a valid session but no currentUser in store, restore it
    if (storedUser && sessionTimestamp && !currentUser) {
      const timestamp = parseInt(sessionTimestamp, 10);
      const now = Date.now();
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      if (!isNaN(timestamp) && (now - timestamp) <= SESSION_DURATION) {
        // Valid session exists, restore it
        restoreSession();
        return;
      }
    }
    
    // Validate user state matches localStorage
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        if (currentUser) {
          // Verify current user matches stored user
          if (currentUser.email !== parsedUser.email || currentUser.id !== parsedUser.id) {
            logWarning('User session mismatch detected! Clearing session for security.', {
              path: pathname,
              currentUserEmail: currentUser.email,
              storedUserEmail: parsedUser.email,
            });
            logout();
            localStorage.removeItem('current-user');
            localStorage.removeItem('user-session-timestamp');
            localStorage.removeItem('orders');
            localStorage.removeItem('saved-addresses');
            localStorage.removeItem('cart');
            return;
          }
          // Update session timestamp on valid access (extends session)
          localStorage.setItem('user-session-timestamp', Date.now().toString());
        }
      } catch (e) {
        // Invalid stored user data, clear it
        logWarning('Invalid user data! Clearing for security.', {
          path: pathname,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
        logout();
        localStorage.removeItem('current-user');
        localStorage.removeItem('user-session-timestamp');
        localStorage.removeItem('orders');
        localStorage.removeItem('saved-addresses');
        localStorage.removeItem('cart');
      }
    } else if (currentUser) {
      // If localStorage has no user but currentUser exists, clear state
      logWarning('State mismatch: currentUser exists but no localStorage data. Clearing state.', {
        path: pathname,
        currentUserEmail: currentUser.email,
      });
      logout();
    }
  }, [currentUser, logout, pathname, restoreSession]); // Re-validate on route change

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow w-full">
          {children}
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

