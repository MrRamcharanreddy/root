import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

// Currency information with exchange rates (base: USD)
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate relative to USD
  flag: string; // Country flag emoji or code
}

// Comprehensive list of currencies for Shiprocket-supported countries (220+ countries)
export const CURRENCIES: Record<string, Currency> = {
  // Major Currencies
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, flag: '🇬🇧' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.0, flag: '🇮🇳' },
  
  // North America
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.35, flag: '🇨🇦' },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', rate: 17.0, flag: '🇲🇽' },
  
  // Asia Pacific
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.52, flag: '🇦🇺' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.66, flag: '🇳🇿' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.0, flag: '🇯🇵' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.2, flag: '🇨🇳' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.82, flag: '🇭🇰' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.34, flag: '🇸🇬' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1310.0, flag: '🇰🇷' },
  TWD: { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', rate: 31.5, flag: '🇹🇼' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 35.0, flag: '🇹🇭' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 4.7, flag: '🇲🇾' },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 55.0, flag: '🇵🇭' },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 15600.0, flag: '🇮🇩' },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 24500.0, flag: '🇻🇳' },
  
  // Middle East
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, flag: '🇦🇪' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rate: 3.75, flag: '🇸🇦' },
  ILS: { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.65, flag: '🇮🇱' },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', rate: 3.64, flag: '🇶🇦' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', rate: 0.31, flag: '🇰🇼' },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', rate: 0.38, flag: '🇧🇭' },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: '﷼', rate: 0.38, flag: '🇴🇲' },
  JOD: { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', rate: 0.71, flag: '🇯🇴' },
  LBP: { code: 'LBP', name: 'Lebanese Pound', symbol: '£', rate: 15000.0, flag: '🇱🇧' },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: '£', rate: 31.0, flag: '🇪🇬' },
  
  // Europe
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.88, flag: '🇨🇭' },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 10.5, flag: '🇸🇪' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 10.7, flag: '🇳🇴' },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', rate: 6.87, flag: '🇩🇰' },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rate: 4.0, flag: '🇵🇱' },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', rate: 22.5, flag: '🇨🇿' },
  HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', rate: 360.0, flag: '🇭🇺' },
  RON: { code: 'RON', name: 'Romanian Leu', symbol: 'lei', rate: 4.6, flag: '🇷🇴' },
  BGN: { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', rate: 1.8, flag: '🇧🇬' },
  HRK: { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', rate: 6.9, flag: '🇭🇷' },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 29.0, flag: '🇹🇷' },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 92.0, flag: '🇷🇺' },
  UAH: { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', rate: 36.5, flag: '🇺🇦' },
  
  // South America
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 4.95, flag: '🇧🇷' },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 350.0, flag: '🇦🇷' },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: '$', rate: 900.0, flag: '🇨🇱' },
  COP: { code: 'COP', name: 'Colombian Peso', symbol: '$', rate: 4100.0, flag: '🇨🇴' },
  PEN: { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', rate: 3.7, flag: '🇵🇪' },
  
  // Africa
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.5, flag: '🇿🇦' },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 780.0, flag: '🇳🇬' },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 130.0, flag: '🇰🇪' },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', rate: 12.0, flag: '🇬🇭' },
  ETB: { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rate: 55.0, flag: '🇪🇹' },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 2300.0, flag: '🇹🇿' },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 3700.0, flag: '🇺🇬' },
  MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', rate: 10.0, flag: '🇲🇦' },
  TND: { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', rate: 3.1, flag: '🇹🇳' },
  
  // Other Major Markets
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rate: 280.0, flag: '🇵🇰' },
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.0, flag: '🇧🇩' },
  LKR: { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', rate: 325.0, flag: '🇱🇰' },
  NPR: { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', rate: 133.0, flag: '🇳🇵' },
  MMK: { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', rate: 2100.0, flag: '🇲🇲' },
  KHR: { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', rate: 4100.0, flag: '🇰🇭' },
  LAK: { code: 'LAK', name: 'Lao Kip', symbol: '₭', rate: 21000.0, flag: '🇱🇦' },
};

interface CurrencyStore {
  selectedCurrency: string;
  exchangeRates: Record<string, number> | null; // Kept for backward compatibility
  lastFetch: number | null; // Kept for backward compatibility
  setCurrency: (currencyCode: string) => void;
  getCurrency: () => Currency;
  // Get fixed price for a product in selected currency
  getPrice: (product: Product, currencyCode?: string) => number;
  // Get discounted price for a product (applies discount if available)
  getDiscountedPrice: (product: Product, currencyCode?: string) => { original: number; discounted: number; discountAmount: number; hasDiscount: boolean };
  // Format price with currency symbol (works with fixed prices)
  formatPrice: (price: number, currencyCode?: string) => string;
  // DEPRECATED: Keep for backward compatibility, but use getPrice instead
  convertPrice: (usdPrice: number) => number;
  fetchExchangeRates: () => Promise<void>; // Kept but not needed for fixed prices
}

const RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      selectedCurrency: 'USD',
      exchangeRates: null,
      lastFetch: null,
      
      setCurrency: (currencyCode: string) => {
        if (CURRENCIES[currencyCode]) {
          set({ selectedCurrency: currencyCode });
        }
      },
      
      getCurrency: () => {
        const code = get().selectedCurrency;
        return CURRENCIES[code] || CURRENCIES.USD;
      },
      
      // Get price for a product in the selected currency using API-based conversion
      getPrice: (product: Product, currencyCode?: string) => {
        const code = currencyCode || get().selectedCurrency;
        const state = get();
        
        // Always use USD as base price and convert using exchange rates
        const usdPrice = product.price;
        
        // If USD, return as-is
        if (code === 'USD') {
          return usdPrice;
        }
        
        // Get exchange rate from API (real-time) or fallback to static rate
        const exchangeRates = state.exchangeRates;
        const currency = CURRENCIES[code] || CURRENCIES.USD;
        
        // Use real-time rate if available, otherwise use static rate
        const rate = exchangeRates?.[code] || currency.rate;
        
        // Convert USD price to selected currency
        return usdPrice * rate;
      },
      
      // Get discounted price for a product (applies discount if available)
      getDiscountedPrice: (product: Product, currencyCode?: string) => {
        const code = currencyCode || get().selectedCurrency;
        const originalPrice = get().getPrice(product, code);
        
        // Check if product has discount
        if (!product.discount) {
          return {
            original: originalPrice,
            discounted: originalPrice,
            discountAmount: 0,
            hasDiscount: false,
          };
        }
        
        const discount = product.discount;
        let discountAmount = 0;
        
        // Check if discount applies to this currency
        if (discount.currency && discount.currency !== code) {
          // Discount is currency-specific and doesn't apply to current currency
          return {
            original: originalPrice,
            discounted: originalPrice,
            discountAmount: 0,
            hasDiscount: false,
          };
        }
        
        // Calculate discount amount
        if (discount.type === 'percentage') {
          discountAmount = (originalPrice * discount.value) / 100;
        } else if (discount.type === 'fixed') {
          discountAmount = discount.value;
        }
        
        const discountedPrice = Math.max(0, originalPrice - discountAmount);
        
        return {
          original: originalPrice,
          discounted: discountedPrice,
          discountAmount,
          hasDiscount: true,
        };
      },
      
      fetchExchangeRates: async () => {
        const state = get();
        const now = Date.now();
        
        // Don't fetch if we have recent rates (within cache duration)
        if (state.exchangeRates && state.lastFetch && (now - state.lastFetch) < RATE_CACHE_DURATION) {
          return;
        }
        
        try {
          const response = await fetch('/api/exchange-rates');
          const data = await response.json();
          
          if (data.success && data.rates) {
            set({ 
              exchangeRates: data.rates,
              lastFetch: now 
            });
          }
        } catch (error) {
          // Silently fail - will use static rates as fallback
          // Error is already logged by the API route
        }
      },
      
      formatPrice: (price: number, currencyCode?: string) => {
        const code = currencyCode || get().selectedCurrency;
        const currency = CURRENCIES[code] || CURRENCIES.USD;
        
        // Format based on currency
        const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'COP', 'UGX', 'TZS', 'KHR', 'LAK', 'MMK'];
        const oneDecimalCurrencies = ['HUF', 'TND'];
        
        if (noDecimalCurrencies.includes(currency.code)) {
          // No decimal places
          return `${currency.symbol}${Math.round(price).toLocaleString()}`;
        } else if (oneDecimalCurrencies.includes(currency.code)) {
          // One decimal place
          return `${currency.symbol}${price.toFixed(1)}`;
        } else {
          // 2 decimal places for others
          return `${currency.symbol}${price.toFixed(2)}`;
        }
      },
      
      // DEPRECATED: Keep for backward compatibility
      // Use getPrice() and formatPrice() instead
      convertPrice: (usdPrice: number) => {
        const currency = get().getCurrency();
        const exchangeRates = get().exchangeRates;
        
        // Use real-time rate if available, otherwise use static rate
        const rate = exchangeRates?.[currency.code] || currency.rate;
        return usdPrice * rate;
      },
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
