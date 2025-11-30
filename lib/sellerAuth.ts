import { NextRequest } from 'next/server';

/**
 * Check if seller is authenticated from request cookies
 * This validates the seller-session cookie
 */
export function isSellerAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('seller-session');
  
  if (!sessionToken || sessionToken.value.length === 0) {
    return false;
  }

  // Session tokens are in format: SESSION-{timestamp}-{random}
  // Extract timestamp from token
  const tokenParts = sessionToken.value.split('-');
  if (tokenParts.length < 3 || tokenParts[0] !== 'SESSION') {
    return false;
  }

  // Check if token has valid format
  const timestamp = parseInt(tokenParts[1], 10);
  if (isNaN(timestamp)) {
    return false;
  }

  // Check if session is expired (24 hours)
  const expiresAt = timestamp + (24 * 60 * 60 * 1000);
  if (Date.now() > expiresAt) {
    return false;
  }

  // Token format is valid and not expired
  // Note: In production, you should also verify the token exists in your session store (Redis/database)
  return true;
}

/**
 * Middleware helper to require seller authentication
 * Returns null if authenticated, or an error response if not
 */
export function requireSellerAuth(request: NextRequest): null | Response {
  if (!isSellerAuthenticated(request)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized. Seller authentication required.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  return null;
}

