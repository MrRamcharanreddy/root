import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errorTracking';

// Store active sessions (in production, use Redis or database)
// This should match the one in login route
const activeSessions = new Map<string, { expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('seller-session');
    
    if (sessionToken) {
      // Remove session from active sessions
      activeSessions.delete(sessionToken.value);
    }

    // Create response and clear cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.set('seller-session', '', {
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/seller/logout',
      method: 'POST',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

