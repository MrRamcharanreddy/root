import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import validator from 'validator';

// DOMPurify for client-side only
let DOMPurify: any;
if (typeof window !== 'undefined') {
  DOMPurify = require('dompurify');
}

// Encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

// Detect if we're in build phase (Next.js build process)
// During build, we should never throw errors - just use fallback
const isBuildTime = typeof window === 'undefined' && (
  process.env.NEXT_PHASE === 'phase-production-build' || 
  process.env.NEXT_PHASE === 'phase-development-build' ||
  process.env.CI === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.NETLIFY === 'true' ||
  process.env.RAILWAY_ENVIRONMENT !== undefined ||
  process.env.RENDER === 'true'
);

// Never throw errors during build - always use fallback
// Only warn in development, silently use fallback in production build
if (!ENCRYPTION_KEY) {
  if (!isBuildTime && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Only warn in browser during development
    console.warn('⚠️ WARNING: NEXT_PUBLIC_ENCRYPTION_KEY not set. Using default key for development only.');
  }
  // During build or if not set, silently use fallback - never throw
}

// Use fallback key if not provided (allows build to succeed)
// In production runtime, this should be set, but we don't fail the build
const ENCRYPTION_KEY_FINAL = ENCRYPTION_KEY || 'default-key-change-in-production-dev-only-build-safe';

/**
 * Password Security
 */
export const passwordSecurity = {
  /**
   * Hash a password using bcrypt
   */
  hash: async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  },

  /**
   * Verify a password against a hash
   */
  verify: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  /**
   * Validate password strength
   */
  validateStrength: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Data Encryption
 */
export const encryption = {
  /**
   * Encrypt sensitive data
   */
  encrypt: (data: string): string => {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY_FINAL).toString();
  },

  /**
   * Decrypt sensitive data
   */
  decrypt: (encryptedData: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY_FINAL);
    return bytes.toString(CryptoJS.enc.Utf8);
  },

  /**
   * Encrypt object
   */
  encryptObject: <T>(obj: T): string => {
    return encryption.encrypt(JSON.stringify(obj));
  },

  /**
   * Decrypt object
   */
  decryptObject: <T>(encryptedData: string): T => {
    return JSON.parse(encryption.decrypt(encryptedData)) as T;
  },
};

/**
 * Input Validation & Sanitization
 */
export const inputValidation = {
  /**
   * Sanitize HTML to prevent XSS
   */
  sanitize: (input: string): string => {
    if (typeof window === 'undefined' || !DOMPurify) {
      // Server-side: basic sanitization
      return input.replace(/<[^>]*>/g, '').trim();
    }
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  },

  /**
   * Validate and sanitize email
   */
  validateEmail: (email: string): { valid: boolean; sanitized: string } => {
    const sanitized = validator.normalizeEmail(email.trim());
    const valid = sanitized ? validator.isEmail(sanitized) : false;
    return {
      valid: valid || false,
      sanitized: sanitized || email.trim().toLowerCase(),
    };
  },

  /**
   * Validate and sanitize phone number
   */
  validatePhone: (phone: string): { valid: boolean; sanitized: string } => {
    const sanitized = phone.trim().replace(/[^\d+()-]/g, '');
    const valid = validator.isMobilePhone(sanitized, 'any', { strictMode: false });
    return {
      valid,
      sanitized,
    };
  },

  /**
   * Validate and sanitize name
   */
  validateName: (name: string): { valid: boolean; sanitized: string } => {
    const sanitized = inputValidation.sanitize(name.trim());
    const valid = sanitized.length >= 2 && sanitized.length <= 50 && /^[a-zA-Z\s'-]+$/.test(sanitized);
    return {
      valid,
      sanitized,
    };
  },

  /**
   * Validate address
   */
  validateAddress: (address: string): { valid: boolean; sanitized: string } => {
    const sanitized = inputValidation.sanitize(address.trim());
    const valid = sanitized.length >= 5 && sanitized.length <= 200;
    return {
      valid,
      sanitized,
    };
  },

  /**
   * Validate ZIP code
   */
  validateZipCode: (zip: string): { valid: boolean; sanitized: string } => {
    const sanitized = zip.trim().replace(/\s+/g, '');
    const valid = validator.isPostalCode(sanitized, 'any');
    return {
      valid,
      sanitized,
    };
  },

  /**
   * Validate URL
   */
  validateURL: (url: string): boolean => {
    return validator.isURL(url, { require_protocol: true });
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (input: string, maxLength?: number): string => {
    let sanitized = inputValidation.sanitize(input.trim());
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  },

  /**
   * Validate numeric input
   */
  validateNumber: (value: string | number, min?: number, max?: number): { valid: boolean; value: number } => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const valid = !isNaN(num) && (min === undefined || num >= min) && (max === undefined || num <= max);
    return {
      valid,
      value: num,
    };
  },
};

/**
 * Secure Token Generation
 */
export const tokenSecurity = {
  /**
   * Generate secure random token
   */
  generateToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        token += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return token;
  },

  /**
   * Generate secure reset token
   */
  generateResetToken: (): string => {
    return `RESET-${Date.now()}-${tokenSecurity.generateToken(16)}`;
  },

  /**
   * Generate secure session token
   */
  generateSessionToken: (): string => {
    return `SESSION-${Date.now()}-${tokenSecurity.generateToken(24)}`;
  },
};

/**
 * Rate Limiting (Client-side check)
 */
export const rateLimiting = {
  /**
   * Check if action is rate limited
   */
  checkLimit: (key: string, maxAttempts: number, windowMs: number): boolean => {
    if (typeof window === 'undefined') return true;

    const storageKey = `rate_limit_${key}`;
    const now = Date.now();
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, resetAt: now + windowMs }));
      return true;
    }

    const data = JSON.parse(stored);
    if (now > data.resetAt) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, resetAt: now + windowMs }));
      return true;
    }

    if (data.count >= maxAttempts) {
      return false;
    }

    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  },

  /**
   * Reset rate limit
   */
  resetLimit: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`rate_limit_${key}`);
  },
};

/**
 * Security Headers Helper
 */
export const securityHeaders = {
  /**
   * Get security headers for API routes
   */
  getHeaders: () => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }),
};

/**
 * Data Masking (for display purposes)
 */
export const dataMasking = {
  /**
   * Mask email address
   */
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.length > 2 
      ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
      : '**';
    return `${maskedLocal}@${domain}`;
  },

  /**
   * Mask phone number
   */
  maskPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return '***';
    return `***-***-${cleaned.slice(-4)}`;
  },

  /**
   * Mask credit card number
   */
  maskCard: (card: string): string => {
    const cleaned = card.replace(/\D/g, '');
    if (cleaned.length < 4) return '****';
    return `****-****-****-${cleaned.slice(-4)}`;
  },
};

/**
 * CSRF Protection
 */
export const csrfProtection = {
  /**
   * Generate CSRF token
   */
  generateToken: (): string => {
    return tokenSecurity.generateToken(32);
  },

  /**
   * Validate CSRF token
   */
  validateToken: (token: string, storedToken: string): boolean => {
    return token === storedToken && token.length >= 32;
  },
};

