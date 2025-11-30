/**
 * Application Constants
 * Centralized constants for better maintainability
 */

export const CONSTANTS = {
  // Password constraints
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,

  // Order constraints
  MIN_ORDER_AMOUNT: 50, // cents ($0.50)

  // Visitor tracking
  VISITOR_UPDATE_INTERVAL: 6000, // milliseconds (6 seconds)
  VISITOR_MIN: 150,
  VISITOR_MAX: 1200,
  VISITOR_INITIAL: 247,

  // Session management
  SESSION_TIMEOUT: 5 * 60 * 1000, // 5 minutes in milliseconds

  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_REGISTER_ATTEMPTS: 3,

  // Product constraints
  MAX_PRODUCT_NAME_LENGTH: 100,
  MAX_PRODUCT_DESCRIPTION_LENGTH: 2000,
  MAX_PRODUCT_PRICE: 10000, // $100.00

  // User constraints
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_ADDRESS_LENGTH: 200,
  MIN_ADDRESS_LENGTH: 5,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Image constraints
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Cache TTL
  PRODUCT_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  USER_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
} as const;

// Type-safe constant access
export type ConstantKey = keyof typeof CONSTANTS;

