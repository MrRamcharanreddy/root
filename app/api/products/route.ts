import { NextRequest, NextResponse } from 'next/server';
import Product from '@/models/Product';
import { requireSellerAuth } from '@/lib/sellerAuth';
import { successResponse, errorResponse, withApiHandler, parseRequestBody } from '@/lib/apiHelpers';

/**
 * MongoDB query interface for product search
 */
interface ProductQuery {
  category?: string;
  $or?: Array<{ name: { $regex: string; $options: string } } | { description: { $regex: string; $options: string } }>;
}

/**
 * GET - Fetch all products
 * Supports filtering by category and search query
 * 
 * @param request - Next.js request object
 * @returns List of products matching the query parameters
 */
export const GET = withApiHandler(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: ProductQuery = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    return successResponse({ products }, 200);
  },
  {
    endpoint: '/api/products',
    method: 'GET',
  }
);

/**
 * POST - Create a new product (seller only)
 * Requires seller authentication
 * 
 * @param request - Next.js request object containing product data
 * @returns Created product object
 */
export const POST = withApiHandler(
  async (request: NextRequest) => {
    // Check seller authentication
    const authError = requireSellerAuth(request);
    if (authError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await parseRequestBody(request);
    const product = new Product(body);
    await product.save();

    return successResponse({ product }, 201);
  },
  {
    endpoint: '/api/products',
    method: 'POST',
  }
);

