import mongoose from 'mongoose';
import { logWarning } from './errorTracking';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Only throw error in production or when actually trying to connect
// During build time, we allow MONGODB_URI to be empty
if (!MONGODB_URI && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  // In production runtime, MongoDB URI is required
  // But during build, we allow it to be missing
  logWarning('MONGODB_URI is not set. Database operations will fail.', {
    environment: process.env.NODE_ENV,
  });
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to maintain a cached connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Check if MongoDB URI is available
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set. Please configure it in your .env.local file.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Optimized for serverless environments (Vercel, Railway, Render, etc.)
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

