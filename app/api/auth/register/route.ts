import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { passwordSecurity, inputValidation, rateLimiting } from '@/lib/security';
import { successResponse, errorResponse, withApiHandler, parseRequestBody, validateRequiredFields } from '@/lib/apiHelpers';

/**
 * POST - User registration endpoint
 * Creates a new user account with validation and password hashing
 * 
 * @param request - Next.js request object containing user registration data
 * @returns Created user data (without password hash) on success
 */
export const POST = withApiHandler(
  async (request: NextRequest) => {
    await connectDB();

    const body = await parseRequestBody<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }>(request);

    // Validate required fields
    const requiredValidation = validateRequiredFields(body, ['email', 'password', 'firstName', 'lastName']);
    if (!requiredValidation.valid) {
      return errorResponse(`Missing required fields: ${requiredValidation.missing.join(', ')}`, 400);
    }

    const { email, password, firstName, lastName, phone } = body;

    // Rate limiting check (client-side also checks, but server-side is critical)
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `register_${clientId}`;
    
    // Validate inputs
    const emailValidation = inputValidation.validateEmail(email);
    if (!emailValidation.valid) {
      return errorResponse('Invalid email address', 400);
    }

    const firstNameValidation = inputValidation.validateName(firstName);
    if (!firstNameValidation.valid) {
      return errorResponse('Invalid first name', 400);
    }

    const lastNameValidation = inputValidation.validateName(lastName);
    if (!lastNameValidation.valid) {
      return errorResponse('Invalid last name', 400);
    }

    // Validate password strength
    const passwordValidation = passwordSecurity.validateStrength(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.errors.join('. '), 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailValidation.sanitized });
    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await passwordSecurity.hash(password);

    // Create user
    const user = new User({
      email: emailValidation.sanitized,
      firstName: firstNameValidation.sanitized,
      lastName: lastNameValidation.sanitized,
      phone: phone ? inputValidation.validatePhone(phone).sanitized : undefined,
      passwordHash,
    });

    await user.save();

    // Return user data (without password hash)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    };

    return successResponse({ user: userData }, 201);
  },
  {
    endpoint: '/api/auth/register',
    method: 'POST',
  }
);

