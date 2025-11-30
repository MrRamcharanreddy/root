'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { LogIn, Eye, EyeOff, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useUserAuthStore((state) => state.login);
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const router = useRouter();
  
  // CRITICAL SECURITY: Restore session only when user explicitly visits login page
  // This allows legitimate users to stay logged in, but prevents auto-login on shared URLs
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentUser) {
      const storedUser = localStorage.getItem('current-user');
      const sessionTimestamp = localStorage.getItem('user-session-timestamp');
      
      // Only restore session if it's valid and not expired
      if (storedUser && sessionTimestamp) {
        try {
          const timestamp = parseInt(sessionTimestamp, 10);
          const now = Date.now();
          const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
          
          if (!isNaN(timestamp) && (now - timestamp) <= SESSION_DURATION) {
            const parsedUser = JSON.parse(storedUser);
            // Restore session only on login page (user explicitly navigated here)
            // This prevents auto-login when URL is shared
            useUserAuthStore.setState({ currentUser: parsedUser });
            // Update session timestamp
            localStorage.setItem('user-session-timestamp', Date.now().toString());
            // Redirect if there's a return URL, otherwise stay on login page
            const returnUrl = new URLSearchParams(window.location.search).get('return');
            if (returnUrl) {
              router.push(returnUrl);
            }
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
    } else if (currentUser) {
      // User is already logged in, redirect to home or return URL
      const returnUrl = new URLSearchParams(window.location.search).get('return');
      router.push(returnUrl || '/');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success('Login successful!');
        const returnUrl = new URLSearchParams(window.location.search).get('return') || '/';
        router.push(returnUrl);
      } else {
        toast.error(result.error || 'Invalid email or password');
        setPassword('');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-gray-600">Welcome back! Please sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold">
                  Password *
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

