/**
 * API Route Helper Utilities
 * 
 * This module provides reusable utilities to reduce code duplication across API routes.
 * It standardizes error handling, response formatting, and common patterns.
 * 
 * @module lib/apiHelpers
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { logError } from '@/lib/errorTracking';

/**
 * Standard API response interface
 * 
 * All API responses follow this structure for consistency.
 * 
 * @template T - Type of the data payload
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

/**
 * Creates a standardized success response
 * 
 * @template T - Type of the data being returned
 * @param data - The data to return in the response
 * @param status - HTTP status code (default: 200)
 * @param additionalFields - Optional additional fields to include in the response
 * @returns NextResponse with success: true and the provided data
 * 
 * @example
 * ```typescript
 * return successResponse({ products }, 200);
 * return successResponse({ user }, 201, { message: 'User created' });
 * ```
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  additionalFields?: Record<string, unknown>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...additionalFields,
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 * 
 * @param error - Error message to return
 * @param status - HTTP status code (default: 400)
 * @param additionalFields - Optional additional fields to include in the response
 * @returns NextResponse with success: false and the error message
 * 
 * @example
 * ```typescript
 * return errorResponse('Invalid email address', 400);
 * return errorResponse('User not found', 404, { code: 'USER_NOT_FOUND' });
 * ```
 */
export function errorResponse(
  error: string,
  status: number = 400,
  additionalFields?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...additionalFields,
    },
    { status }
  );
}

/**
 * Wraps an API route handler with common error handling and DB connection
 * 
 * This higher-order function automatically:
 * - Connects to the database (unless disabled)
 * - Catches and logs errors
 * - Returns standardized error responses
 * 
 * @template T - Type of the response data
 * @param handler - The API route handler function
 * @param options - Configuration options
 * @param options.requireDB - Whether to connect to database (default: true)
 * @param options.endpoint - Endpoint path for error logging
 * @param options.method - HTTP method for error logging
 * @returns Wrapped handler function with error handling
 * 
 * @example
 * ```typescript
 * export const GET = withApiHandler(
 *   async (request) => {
 *     const products = await Product.find();
 *     return successResponse({ products });
 *   },
 *   { endpoint: '/api/products', method: 'GET' }
 * );
 * ```
 */
export function withApiHandler<T>(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse<ApiResponse<T>>>,
  options?: {
    requireDB?: boolean;
    endpoint?: string;
    method?: string;
  }
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // Connect to database if required
      if (options?.requireDB !== false) {
        await connectDB();
      }

      // Execute the handler
      return await handler(request, ...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const endpoint = options?.endpoint || request.url;
      const method = options?.method || request.method;

      logError(error instanceof Error ? error : new Error('API handler error'), {
        endpoint,
        method,
        errorMessage,
      });

      return errorResponse(
        `Failed to process request: ${errorMessage}`,
        500
      ) as NextResponse<ApiResponse<T>>;
    }
  };
}

/**
 * Safely parses JSON from request body
 * 
 * @template T - Expected type of the parsed body
 * @param request - Next.js request object
 * @returns Parsed JSON body as type T
 * @throws Error if JSON parsing fails
 * 
 * @example
 * ```typescript
 * const body = await parseRequestBody<{ email: string; password: string }>(request);
 * ```
 */
export async function parseRequestBody<T = unknown>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validates that required fields are present in request body
 * 
 * @param body - Request body object to validate
 * @param requiredFields - Array of field names that must be present
 * @returns Validation result with validity status and missing fields
 * 
 * @example
 * ```typescript
 * const validation = validateRequiredFields(body, ['email', 'password']);
 * if (!validation.valid) {
 *   return errorResponse(`Missing: ${validation.missing.join(', ')}`);
 * }
 * ```
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => !body[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

