import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { tokenSecurity } from '@/lib/security';
import { logError } from '@/lib/errorTracking';

// GET - Fetch orders for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, orders },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/orders',
      method: 'GET',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, shippingAddress, total, paymentIntentId, paymentMethod } = body;

    // Generate tracking number
    const trackingNumber = `TRK${tokenSecurity.generateToken(10).toUpperCase()}`;
    
    // Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const order = new Order({
      userId,
      items,
      shippingAddress,
      total,
      paymentMethod: paymentMethod || 'card',
      paymentIntentId,
      trackingNumber,
      estimatedDelivery,
      status: 'pending',
    });

    await order.save();

    const orderData = {
      id: order._id.toString(),
      ...order.toObject(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      estimatedDelivery: order.estimatedDelivery?.toISOString(),
    };

    return NextResponse.json(
      { success: true, order: orderData },
      { status: 201 }
    );
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/orders',
      method: 'POST',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

