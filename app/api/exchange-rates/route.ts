import { NextResponse } from 'next/server';
import { logError } from '@/lib/errorTracking';

// Cache exchange rates for 1 hour to avoid excessive API calls
let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET() {
  try {
    // Check if we have cached rates that are still valid
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
      return NextResponse.json({ 
        success: true, 
        rates: cachedRates.rates,
        cached: true 
      });
    }

    // Fetch real-time exchange rates from exchangerate-api.com (free tier)
    // Using USD as base currency
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Cache the rates
    cachedRates = {
      rates: data.rates,
      timestamp: Date.now()
    };

    return NextResponse.json({ 
      success: true, 
      rates: data.rates,
      cached: false 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(error instanceof Error ? error : new Error('Failed to fetch exchange rates'), {
      endpoint: '/api/exchange-rates',
      method: 'GET',
    });
    
    // Return fallback rates if API fails
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      rates: getFallbackRates(),
      fallback: true 
    }, { status: 200 }); // Still return 200 with fallback data
  }
}

// Fallback rates if API is unavailable (updated approximate rates)
function getFallbackRates(): Record<string, number> {
  return {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.0,
    CAD: 1.35,
    MXN: 17.0,
    AUD: 1.52,
    NZD: 1.66,
    JPY: 149.0,
    CNY: 7.2,
    HKD: 7.82,
    SGD: 1.34,
    KRW: 1310.0,
    TWD: 31.5,
    THB: 35.0,
    MYR: 4.7,
    PHP: 55.0,
    IDR: 15600.0,
    VND: 24500.0,
    AED: 3.67,
    SAR: 3.75,
    ILS: 3.65,
    QAR: 3.64,
    KWD: 0.31,
    BHD: 0.38,
    OMR: 0.38,
    JOD: 0.71,
    LBP: 15000.0,
    EGP: 31.0,
    CHF: 0.88,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.87,
    PLN: 4.0,
    CZK: 22.5,
    HUF: 360.0,
    RON: 4.6,
    BGN: 1.8,
    HRK: 6.9,
    TRY: 29.0,
    RUB: 92.0,
    UAH: 36.5,
    BRL: 4.95,
    ARS: 350.0,
    CLP: 900.0,
    COP: 4100.0,
    PEN: 3.7,
    ZAR: 18.5,
    NGN: 780.0,
    KES: 130.0,
    GHS: 12.0,
    ETB: 55.0,
    TZS: 2300.0,
    UGX: 3700.0,
    MAD: 10.0,
    TND: 3.1,
    PKR: 280.0,
    BDT: 110.0,
    LKR: 325.0,
    NPR: 133.0,
    MMK: 2100.0,
    KHR: 4100.0,
    LAK: 21000.0,
  };
}

