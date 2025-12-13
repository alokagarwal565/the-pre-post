/**
 * Ideas API routes
 * GET /api/ideas - Get user's ideas
 * POST /api/ideas - Create new idea (raw input)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ideas = await sql`
      SELECT id, content, source, created_at
      FROM ideas
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Get ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, source } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Store raw input as-is (no formatting, no AI)
    const result = await sql`
      INSERT INTO ideas (user_id, content, source)
      VALUES (${user.userId}, ${content.trim()}, ${source || 'text'})
      RETURNING id, content, source, created_at
    `;

    return NextResponse.json({ idea: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Create idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

