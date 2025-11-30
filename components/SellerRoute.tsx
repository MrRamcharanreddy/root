'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';

export default function SellerRoute({ children }: { children: React.ReactNode }) {
  const isSeller = useAuthStore((state) => state.isSeller);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Check authentication status from server
    const verifyAuth = async () => {
      setChecking(true);
      // Small delay to ensure cookies are available after login
      await new Promise(resolve => setTimeout(resolve, 50));
      await checkAuth();
      setChecking(false);
    };

    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && !checking && !isSeller) {
      router.push('/seller/login');
    }
  }, [mounted, checking, isSeller, router]);

  // Prevent hydration mismatch by only checking auth after mount
  if (!mounted || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

