import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logError } from '@/lib/errorTracking';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

// Validate Stripe key format
const isValidStripeKey = (key: string): boolean => {
  return key.startsWith('sk_test_') || key.startsWith('sk_live_') || key.startsWith('rk_test_') || key.startsWith('rk_live_');
};

let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY && isValidStripeKey(STRIPE_SECRET_KEY)) {
  try {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      // Using default API version (latest supported by the Stripe SDK)
      typescript: true,
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to initialize Stripe'), {
      context: 'Stripe initialization',
    });
  }
}

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env.local file. See SETUP.md for instructions.' 
      },
      { status: 500 }
    );
  }

  if (!isValidStripeKey(STRIPE_SECRET_KEY)) {
    return NextResponse.json(
      { 
        error: 'Invalid Stripe secret key format. The key should start with "sk_test_" or "sk_live_". Please check your .env.local file.' 
      },
      { status: 500 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { 
        error: 'Failed to initialize Stripe. Please check your STRIPE_SECRET_KEY in .env.local file.' 
      },
      { status: 500 }
    );
  }

  try {
    const { amount, items, shippingAddress } = await request.json();

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 50) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum order is $0.50' },
        { status: 400 }
      );
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items array. At least one item is required.' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return NextResponse.json(
          { error: 'Invalid item: missing or invalid id' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Invalid item: quantity must be at least 1' },
          { status: 400 }
        );
      }
      if (!item.price || typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json(
          { error: 'Invalid item: missing or invalid price' },
          { status: 400 }
        );
      }
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json(
        { error: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
      return NextResponse.json(
        { error: 'Shipping address must include street, city, and country' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: process.env.NEXT_PUBLIC_STRIPE_CURRENCY || 'usd',
      metadata: {
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown payment intent error'), {
      endpoint: '/api/create-payment-intent',
      method: 'POST',
    });
    
    // Provide helpful error messages
    let errorMessage = 'Failed to create payment intent';
    
    if (error instanceof Error) {
      if ('type' in error && error.type === 'StripeInvalidRequestError') {
        if (error.message?.includes('Invalid API Key')) {
          errorMessage = 'Invalid Stripe API key. Please check your STRIPE_SECRET_KEY in .env.local file. Make sure you copied the complete key starting with "sk_test_" or "sk_live_".';
        } else {
          errorMessage = `Stripe error: ${error.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

