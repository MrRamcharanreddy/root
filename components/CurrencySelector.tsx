'use client';

import { useCurrencyStore, CURRENCIES } from '@/lib/currencyStore';
import { Globe, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function CurrencySelector() {
  const { selectedCurrency, setCurrency, getCurrency, fetchExchangeRates } = useCurrencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentCurrency = getCurrency();

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch exchange rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrency(currencyCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter currencies based on search query
  const filteredCurrencies = Object.values(CURRENCIES).filter((currency) => {
    const query = searchQuery.toLowerCase();
    return (
      currency.name.toLowerCase().includes(query) ||
      currency.code.toLowerCase().includes(query) ||
      currency.symbol.toLowerCase().includes(query)
    );
  });

  if (!mounted) {
    // Return a placeholder that matches server-side rendering
    return (
      <div className="relative" suppressHydrationWarning>
        <button
          className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
          aria-label="Select currency"
          disabled
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">$</span>
          <span className="hidden md:inline">USD</span>
          <svg
            className="w-4 h-4 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        aria-label="Select currency"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentCurrency.symbol}</span>
        <span className="hidden md:inline">{currentCurrency.code}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[500px] flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Currency List */}
          <div className="overflow-y-auto flex-1">
            <div className="p-2">
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCurrency === currency.code
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{currency.flag}</span>
                      <div className="text-left">
                        <div className="font-medium">{currency.name}</div>
                        <div className="text-xs text-gray-500">{currency.code}</div>
                      </div>
                    </div>
                    <span className="font-semibold">{currency.symbol}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No currencies found
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
            {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'currency' : 'currencies'} available
          </div>
        </div>
      )}
    </div>
  );
}

