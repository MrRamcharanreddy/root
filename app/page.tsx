'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useProductStore } from '@/lib/productStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import ProductCard from '@/components/ProductCard';
import TrustBadges from '@/components/TrustBadges';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/structuredData';
import { ShoppingBag, Heart, Award, Truck, Sparkles } from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load heavy components
const Newsletter = lazy(() => import('@/components/Newsletter'));
const StructuredData = lazy(() => import('@/components/StructuredData'));

export default function Home() {
  const products = useProductStore((state) => state.getAllProducts());
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const logout = useUserAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // CRITICAL SECURITY FIX: Don't auto-load user on home page
    // When URL is shared, it should just show the home page without logging in
    // Users must explicitly log in through the login page
    // This prevents auto-login when URL is shared or opened in new tab
    if (typeof window !== 'undefined' && currentUser) {
      // If user is already logged in (from login page), validate their session
      const storedUser = localStorage.getItem('current-user');
      const sessionTimestamp = localStorage.getItem('user-session-timestamp');
      
      if (!storedUser || !sessionTimestamp) {
        // No valid session, clear state
        logout();
        return;
      }
      
      // Validate session timestamp
      const timestamp = parseInt(sessionTimestamp, 10);
      const now = Date.now();
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      if (isNaN(timestamp) || (now - timestamp) > SESSION_DURATION) {
        // Session expired, clear everything
        logout();
        localStorage.removeItem('current-user');
        localStorage.removeItem('user-session-timestamp');
        localStorage.removeItem('orders');
        localStorage.removeItem('saved-addresses');
        localStorage.removeItem('cart');
        return;
      }
      
      // Validate user matches
      try {
        const parsedUser = JSON.parse(storedUser);
        if (currentUser.email !== parsedUser.email || currentUser.id !== parsedUser.id) {
          // Mismatch, clear everything
          logout();
          localStorage.removeItem('current-user');
          localStorage.removeItem('user-session-timestamp');
          localStorage.removeItem('orders');
          localStorage.removeItem('saved-addresses');
          localStorage.removeItem('cart');
          return;
        }
        // Update session timestamp on valid access
        localStorage.setItem('user-session-timestamp', Date.now().toString());
      } catch (e) {
        // Invalid data, clear everything
        logout();
        localStorage.removeItem('current-user');
        localStorage.removeItem('user-session-timestamp');
        localStorage.removeItem('orders');
        localStorage.removeItem('saved-addresses');
        localStorage.removeItem('cart');
      }
    }
  }, [currentUser, logout]);

  const featuredProducts = products.slice(0, 4);

  return (
    <>
      <Suspense fallback={null}>
      <StructuredData data={[generateOrganizationSchema(), generateWebSiteSchema()]} />
      </Suspense>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden min-h-[600px] flex items-center">
        {/* Enhanced decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-20"></div>
        </div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-sm md:text-base font-semibold">✨ Authentic Indian Snacks</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight tracking-tight">
              <span className="block bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent">
                Taste of Indian Desi
              </span>
              <span className="block text-3xl md:text-5xl lg:text-6xl mt-4 font-bold text-yellow-200 drop-shadow-lg">
                India&apos;s Finest, Delivered Fresh
              </span>
            </h1>
            
            {/* Description */}
            <div className="max-w-2xl mx-auto mb-10">
              <p className="text-xl md:text-2xl lg:text-3xl mb-4 text-white/95 font-medium leading-relaxed">
                Handcrafted with time-honored recipes, shipped fresh from our kitchen to your doorstep—anywhere in the world.
              </p>
              <p className="text-lg md:text-xl lg:text-2xl text-yellow-100 font-light italic">
                Savor the authentic flavors that have brought joy to families for generations.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center bg-white text-primary-600 px-10 py-4 md:px-12 md:py-5 rounded-xl font-bold text-lg md:text-xl hover:bg-yellow-50 transition-all shadow-2xl hover:shadow-white/20 transform hover:-translate-y-2 hover:scale-105 duration-300"
              >
                <ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore Collection
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center bg-transparent border-2 border-white/80 text-white px-10 py-4 md:px-12 md:py-5 rounded-xl font-bold text-lg md:text-xl hover:bg-white/10 backdrop-blur-sm transition-all shadow-xl hover:shadow-white/10 transform hover:-translate-y-1 duration-300"
              >
                Our Story
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 md:gap-8 text-sm md:text-base">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/90">Free Worldwide Shipping</span>
              </div>
              <div className="hidden md:block w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-300" />
                <span className="text-white/90">Premium Quality</span>
              </div>
              <div className="hidden md:block w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-300" />
                <span className="text-white/90">Authentic Recipes</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 md:h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,120 L0,120 Z" fill="white" opacity="0.1"></path>
          </svg>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Global Shipping</h3>
              <p className="text-gray-600">We deliver worldwide</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-gray-600">Handcrafted with care</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Healthy & Energetic</h3>
              <p className="text-gray-600">Perfect for all ages—from babies to seniors</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Authentic Taste</h3>
              <p className="text-gray-600">Traditional recipes</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Checkout</h3>
              <p className="text-gray-600">Safe & easy payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 text-lg">
              Discover our most popular snacks
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {mounted && featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!mounted && [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <Suspense fallback={<div className="py-16 bg-gray-50"><div className="container mx-auto px-4 text-center">Loading...</div></div>}>
      <Newsletter />
      </Suspense>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About Roots2Global</h2>
            <p className="text-lg text-gray-700 mb-4">
              Roots2Global is dedicated to bringing you the finest Taste of Indian Desi - authentic 
              Indian snacks that have been crafted with traditional recipes passed down through 
              generations. Our commitment to quality and authenticity ensures that every bite 
              transports you to the vibrant flavors of India.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Whether you&apos;re craving spicy masala peanuts, traditional mixtures, or premium 
              nuts, we have something special for every snack lover. Shop with confidence 
              knowing that we deliver globally with care and precision.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
                <p className="text-gray-600">Countries Served</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">4.9/5</div>
                <p className="text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

