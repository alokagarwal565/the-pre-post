/**
 * Database connection using Neon serverless driver
 * Optimized for Vercel serverless functions
 * Using raw SQL for maximum compatibility and simplicity
 */
import { neon } from '@neondatabase/serverless';

// Neon serverless client - works perfectly with Vercel
// Fallback to empty string to allow build to pass if env var is missing
// The query will fail at runtime if not set, which is expected
export const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder:placeholder@placeholder.neondatabase.cloud/placeholder');

