/**
 * Database connection using Neon serverless driver
 * Optimized for Vercel serverless functions
 * Using raw SQL for maximum compatibility and simplicity
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Neon serverless client - works perfectly with Vercel
export const sql = neon(process.env.DATABASE_URL);

