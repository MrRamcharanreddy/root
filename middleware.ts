import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Seller session cookie name
const SELLER_SESSION_COOKIE = 'seller-session';

// Check if seller is authenticated
// Note: In production, this should validate against a database or Redis
// For now, we validate the token format and expiration timestamp
function isSellerAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(SELLER_SESSION_COOKIE);
  
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
  // Note: In production, you should also verify the token exists in your session store
  // For now, we rely on the API routes to manage sessions properly
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /seller routes except /seller/login
  if (pathname.startsWith('/seller') && pathname !== '/seller/login') {
    // Check if seller is authenticated
    if (!isSellerAuthenticated(request)) {
      // Redirect to seller login
      const loginUrl = new URL('/seller/login', request.url);
      // Add redirect parameter so we can redirect back after login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access to seller login page
  if (pathname === '/seller/login') {
    // If already authenticated, redirect to seller dashboard
    if (isSellerAuthenticated(request)) {
      return NextResponse.redirect(new URL('/seller', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/seller/:path*',
  ],
};

