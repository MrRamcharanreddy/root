import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { isSellerAuthenticated, requireSellerAuth } from '@/lib/sellerAuth';
import { logError } from '@/lib/errorTracking';

// GET - Get order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    const orderId = params.id;

    const order = await Order.findById(orderId).lean();

    if (!order || Array.isArray(order)) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order (or is seller)
    const isSeller = isSellerAuthenticated(request);
    if (!isSeller && order.userId && order.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, order },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: `/api/orders/${params.id}`,
      method: 'GET',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH - Update order status (seller only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check seller authentication
    const authError = requireSellerAuth(request);
    if (authError) {
      return authError;
    }

    await connectDB();

    const orderId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'processing', 'shipped', 'delivered'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();

    if (!order || Array.isArray(order)) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, order },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: `/api/orders/${params.id}`,
      method: 'PATCH',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

