'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { logWarning } from '@/lib/errorTracking';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // CRITICAL SECURITY FIX: Restore session only on protected routes
    // This allows legitimate users to access protected pages, but prevents auto-login on shared URLs
    if (typeof window !== 'undefined') {
      if (!currentUser) {
        // Try to restore session from localStorage (only for protected routes)
        const storedUser = localStorage.getItem('current-user');
        const sessionTimestamp = localStorage.getItem('user-session-timestamp');
        
        if (storedUser && sessionTimestamp) {
          try {
            const timestamp = parseInt(sessionTimestamp, 10);
            const now = Date.now();
            const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
            
            if (!isNaN(timestamp) && (now - timestamp) <= SESSION_DURATION) {
              const parsedUser = JSON.parse(storedUser);
              // Restore session for protected routes
              useUserAuthStore.setState({ currentUser: parsedUser });
              // Update session timestamp
              localStorage.setItem('user-session-timestamp', Date.now().toString());
              return; // Session restored, allow access
            } else {
              // Session expired, clear it
              localStorage.removeItem('current-user');
              localStorage.removeItem('user-session-timestamp');
            }
          } catch (e) {
            // Invalid data, clear it
            localStorage.removeItem('current-user');
            localStorage.removeItem('user-session-timestamp');
          }
        }
        
        // No valid session, redirect to login
        const currentPath = window.location.pathname;
        router.push(`/login?return=${encodeURIComponent(currentPath)}`);
      } else {
        // User is logged in, validate session
        const storedUser = localStorage.getItem('current-user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // If currentUser doesn't match stored user, clear everything
            if (currentUser.email !== parsedUser.email || currentUser.id !== parsedUser.id) {
              logWarning('User mismatch detected! Clearing data for security.', {
                path: typeof window !== 'undefined' ? window.location.pathname : undefined,
                currentUserEmail: currentUser.email,
                storedUserEmail: parsedUser.email,
              });
              // Clear all user data
              localStorage.removeItem('current-user');
              localStorage.removeItem('user-session-timestamp');
              localStorage.removeItem('orders');
              localStorage.removeItem('saved-addresses');
              localStorage.removeItem('cart');
              // Force logout
              useUserAuthStore.getState().logout();
              window.location.href = '/login';
              return;
            }
            // Update session timestamp on valid access
            localStorage.setItem('user-session-timestamp', Date.now().toString());
          } catch (e) {
            // Invalid stored user data, clear it
            localStorage.removeItem('current-user');
            localStorage.removeItem('user-session-timestamp');
            useUserAuthStore.getState().logout();
            router.push('/login');
          }
        }
      }
    }
  }, [currentUser, router]);

  // Prevent hydration mismatch by not checking auth until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to continue...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

