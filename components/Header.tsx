'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';
import { useUserAuthStore } from '@/lib/userAuthStore';
import { useWishlistStore } from '@/lib/wishlistStore';
import { ShoppingCart, Menu, X, User, LogOut, Search, Heart, Bell, Globe, Shield, Truck, Sparkles, TrendingUp } from 'lucide-react';
import CurrencySelector from './CurrencySelector';
import { useCurrencyStore } from '@/lib/currencyStore';
import { useState, useEffect, useRef, useCallback, useMemo, FormEvent } from 'react';

export default function Header() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const getDiscountedPrice = useCurrencyStore((state) => state.getDiscountedPrice);
  const wishlistCount = useWishlistStore((state) => state.getWishlistCount());
  const isSeller = useAuthStore((state) => state.isSeller);
  const currentUser = useUserAuthStore((state) => state.currentUser);
  const logout = useUserAuthStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState(247); // Fixed initial value to prevent hydration mismatch (reasonable 3-4 digit range)
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // CRITICAL: Only calculate cart values after hydration to prevent mismatch
  // Subscribe to items array to trigger re-render when cart changes
  const totalItems = useMemo(() => mounted ? getTotalItems() : 0, [mounted, getTotalItems]);
  // Calculate total using currency-specific discounted prices (same as cart page)
  const totalPrice = useMemo(() => {
    if (!mounted) return 0;
    return cartItems.reduce((sum, item) => {
      const priceInfo = getDiscountedPrice(item);
      return sum + (priceInfo.discounted * item.quantity);
    }, 0);
  }, [mounted, cartItems, getDiscountedPrice]);

  // Fix hydration mismatch by only showing seller link after client-side hydration
  useEffect(() => {
    setMounted(true);
    
    // Initialize live visitors with reasonable random value only on client side
    // "Fake it until we make it" - showing believable numbers to create sensible hype
    setLiveVisitors(Math.floor(Math.random() * 800) + 200); // Random between 200-1000 (reasonable 3-4 digit range)
    
    // Simulate realistic live visitor count updates (3-4 digit numbers)
    // Creates dynamic, believable social proof with sensible fluctuations
    const visitorInterval = setInterval(() => {
      setLiveVisitors(prev => {
        // Realistic variation: natural ups and downs
        const direction = Math.random() > 0.4 ? 1 : -1; // 60% chance to increase (more realistic)
        const change = Math.floor(Math.random() * 8) + 2; // 2-10 change (smaller, more realistic increments)
        const newValue = prev + (change * direction);
        // Keep between 150-1200 (reasonable range for a growing e-commerce site)
        return Math.max(150, Math.min(1200, newValue));
      });
    }, 6000); // Update every 6 seconds for more natural feel
    
    // Listen for storage events to update cart badge when cart is cleared elsewhere
    const handleStorageChange = () => {
      // Force re-render by accessing cart items
      const items = useCartStore.getState().items;
      if (items.length === 0) {
        setShowCartPreview(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom cart-cleared event
    window.addEventListener('cart-cleared', handleStorageChange);
    
    return () => {
      clearInterval(visitorInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-cleared', handleStorageChange);
    };
  }, []);

  // Scroll effect for header
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close search dropdown when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSearch(false);
    }
    if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
      setShowCartPreview(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Ensure seller auth is cleared if buyer is logged in (buyers should NEVER see seller options)
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      // Buyer is logged in - clear seller auth to prevent conflicts
      localStorage.removeItem('seller-auth');
      // Force update to hide seller link
      useAuthStore.setState({ isSeller: false });
    }
  }, [currentUser]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSearch = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  }, [searchQuery, router]);

  // Search suggestions (mock data - in production, fetch from API)
  const searchSuggestions = [
    'Millet Laddus',
    'Millet Flours',
    'Dry Flesh',
    'Sweet Snacks',
    'Savouries',
    'Pickels',
  ].filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return 'U';
    return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
  };

  return (
    <>
      {/* Top Promotional Banner - Centered */}
      {showPromoBanner && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm py-2 relative overflow-hidden">
          <div className="container mx-auto px-4 flex items-center justify-center relative">
            <div className="flex items-center justify-center space-x-6 md:space-x-8 flex-1">
              <div className="flex items-center space-x-2 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">Free Shipping Worldwide!</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-white/30"></div>
              <div className="flex items-center space-x-2 text-primary-100">
                <TrendingUp className="w-4 h-4 animate-pulse" />
                <span className="font-bold text-white">
                  <span className="inline-block min-w-[4ch] text-right tabular-nums">{liveVisitors.toLocaleString()}</span>
                  <span className="ml-1">people browsing now</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowPromoBanner(false)}
              className="absolute right-4 hover:text-white/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_3s_infinite]"></div>
          </div>
        </div>
      )}

      <header className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : 'shadow-md'
      }`}>
        <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl md:text-2xl font-bold text-primary-600 mr-6 md:mr-8 lg:mr-10 whitespace-nowrap hover:text-primary-700 transition-colors flex items-center space-x-2 group">
            <span className="relative">
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
            </span>
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Roots2Global
            </span>
            <Shield className="w-5 h-5 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-6 xl:space-x-7 flex-1 justify-center ml-4 lg:ml-6">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-all duration-200 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-all duration-200 relative group">
              Products
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/bulk-orders" className="text-gray-700 hover:text-primary-600 transition-all duration-200 relative group whitespace-nowrap">
              Bulk Orders
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-primary-600 transition-all duration-200 relative group">
              Orders
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-all duration-200 relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-all duration-200 relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-md mx-6 lg:mx-8 relative">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>
            
            {/* Search Suggestions Dropdown */}
            {showSearch && searchQuery.length > 0 && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      router.push(`/products?search=${encodeURIComponent(suggestion)}`);
                      setShowSearch(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User & Cart Icons */}
          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Currency Selector */}
            <div suppressHydrationWarning>
              <CurrencySelector />
            </div>
            {mounted && (
              <>
                {currentUser ? (
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-all duration-300 group hover-3d-lift"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="relative flip-3d" style={{ perspective: '1000px' }}>
                        <div className="flip-3d-inner">
                          <div className="flip-3d-front w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110" style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}>
                            {getUserInitials()}
                          </div>
                          <div className="flip-3d-back w-8 h-8 rounded-full bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-white text-xs font-bold shadow-md" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0 }}>
                            <User className="w-4 h-4" />
                          </div>
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse3d"></span>
                      </div>
                      <span className="hidden md:inline text-sm font-semibold group-hover:scale-105 transition-transform duration-300">
                        {currentUser.firstName}
                      </span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border py-2 z-50 user-menu-container transition-all duration-200 opacity-100 translate-y-0">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-semibold text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
                          <p className="text-xs text-gray-500">{currentUser.email}</p>
                        </div>
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center space-x-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>My Account</span>
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center space-x-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/wishlist"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center space-x-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Heart className="w-4 h-4" />
                          <span>My Wishlist</span>
                        </Link>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary-600 transition-colors font-semibold"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
            {mounted && currentUser && (
              <Link
                href="/wishlist"
                className="relative p-2 text-gray-700 hover:text-primary-600 transition-all duration-200 group"
              >
                <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-primary-600 text-primary-600' : ''} group-hover:scale-110 transition-transform`} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            
            {/* Cart with Preview - Only render after hydration to prevent mismatch */}
            {mounted && (
              <div ref={cartRef} className="relative ml-4">
                <Link
                  href="/cart"
                  onMouseEnter={() => totalItems > 0 && setShowCartPreview(true)}
                  onMouseLeave={() => setShowCartPreview(false)}
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-all duration-200 group"
                >
                  <ShoppingCart className={`w-6 h-6 group-hover:scale-110 transition-transform ${totalItems > 0 ? 'animate-bounce' : ''}`} />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse" suppressHydrationWarning>
                      {totalItems}
                    </span>
                  )}
                </Link>
                
                {/* Cart Preview Dropdown */}
                {showCartPreview && totalItems > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 transition-all duration-200 opacity-100 translate-y-0">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                        <span>Shopping Cart</span>
                        <span className="text-sm text-primary-600">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {cartItems.slice(0, 3).map((item) => {
                        const priceInfo = getDiscountedPrice(item);
                        const itemTotal = priceInfo.discounted * item.quantity;
                        return (
                          <div key={item.id} className="p-4 border-b hover:bg-gray-50 transition-colors flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              loading="lazy"
                              quality={75}
                            />
                          </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(priceInfo.discounted)}</p>
                            </div>
                            <p className="text-sm font-bold text-primary-600">{formatPrice(itemTotal)}</p>
                          </div>
                        );
                      })}
                      {cartItems.length > 3 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          +{cartItems.length - 3} more items
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-primary-600">{formatPrice(totalPrice)}</span>
                      </div>
                      <Link
                        href="/cart"
                        onClick={() => setShowCartPreview(false)}
                        className="block w-full bg-primary-600 text-white text-center py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        View Cart
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4 px-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </form>
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/bulk-orders"
                className="text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bulk Orders
              </Link>
              <Link
                href="/orders"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Orders
              </Link>
              {mounted && currentUser && (
                <Link
                  href="/wishlist"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Wishlist
                </Link>
              )}
              <Link
                href="/about"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
    </>
  );
}

