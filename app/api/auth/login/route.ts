import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { passwordSecurity, inputValidation } from '@/lib/security';
import { successResponse, errorResponse, withApiHandler, parseRequestBody } from '@/lib/apiHelpers';

/**
 * POST - User login endpoint
 * Authenticates user with email and password
 * 
 * Security: Returns generic error message to prevent user enumeration
 * 
 * @param request - Next.js request object containing email and password
 * @returns User data (without password hash) on success
 */
export const POST = withApiHandler(
  async (request: NextRequest) => {
    await connectDB();

    const body = await parseRequestBody<{ email: string; password: string }>(request);
    const { email, password } = body;

    // Validate email
    const emailValidation = inputValidation.validateEmail(email);
    if (!emailValidation.valid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Find user
    const user = await User.findOne({ email: emailValidation.sanitized });
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await passwordSecurity.verify(password, user.passwordHash);
    if (!isValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Return user data (without password hash)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    };

    return successResponse({ user: userData }, 200);
  },
  {
    endpoint: '/api/auth/login',
    method: 'POST',
  }
);

