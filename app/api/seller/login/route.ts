import { NextRequest, NextResponse } from 'next/server';
import { passwordSecurity, rateLimiting, tokenSecurity } from '@/lib/security';
import { logError } from '@/lib/errorTracking';

// Seller password hash (in production, store this securely)
// Default password: seller123
const SELLER_PASSWORD_HASH = '$2b$12$rFGgy0IGObVT/fXWypxFeOLvq7rYRCb1sXKVxuYgFrEJcQrdRhLyO'; // seller123

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map<string, { expiresAt: number }>();

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  activeSessions.forEach((session, token) => {
    if (now > session.expiresAt) {
      activeSessions.delete(token);
    }
  });
}, 60 * 60 * 1000); // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Rate limiting (max 5 attempts per 15 minutes per IP)
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const rateLimitKey = `seller_login_${clientIp}`;
    
    // Note: This is a simplified rate limit check
    // In production, use a proper rate limiting service
    const rateLimitData = request.cookies.get(`rate_limit_${rateLimitKey}`);
    if (rateLimitData) {
      const data = JSON.parse(rateLimitData.value);
      if (Date.now() < data.resetAt && data.count >= 5) {
        return NextResponse.json(
          { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
          { status: 429 }
        );
      }
    }

    // Verify password hash
    const isValid = await passwordSecurity.verify(password, SELLER_PASSWORD_HASH);
    
    if (!isValid) {
      // Update rate limit
      const now = Date.now();
      const resetAt = now + (15 * 60 * 1000); // 15 minutes
      const existingData = rateLimitData ? JSON.parse(rateLimitData.value) : { count: 0 };
      const newCount = Date.now() < existingData.resetAt ? existingData.count + 1 : 1;
      
      const response = NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
      
      response.cookies.set(`rate_limit_${rateLimitKey}`, JSON.stringify({
        count: newCount,
        resetAt,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60, // 15 minutes
      });
      
      return response;
    }

    // Generate secure session token
    const sessionToken = tokenSecurity.generateSessionToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    // Store session
    activeSessions.set(sessionToken, { expiresAt });

    // Create response with session cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('seller-session', sessionToken, {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Clear rate limit on successful login
    response.cookies.delete(`rate_limit_${rateLimitKey}`);

    return response;
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/seller/login',
      method: 'POST',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to login. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Check if seller is authenticated
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('seller-session');
  
  if (!sessionToken) {
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 401 }
    );
  }

  const session = activeSessions.get(sessionToken.value);
  
  if (!session || Date.now() > session.expiresAt) {
    // Session expired or invalid
    if (session) {
      activeSessions.delete(sessionToken.value);
    }
    
    const response = NextResponse.json(
      { success: false, authenticated: false },
      { status: 401 }
    );
    
    // Clear invalid cookie
    response.cookies.delete('seller-session');
    return response;
  }

  return NextResponse.json(
    { success: true, authenticated: true },
    { status: 200 }
  );
}

