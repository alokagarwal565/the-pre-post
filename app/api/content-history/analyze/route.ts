/**
 * Analyze content history API route
 * POST /api/content-history/analyze
 * Checks for repetition and suggests missing perspectives
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
import { analyzeContentHistory } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentIdea } = await request.json();

    if (!currentIdea) {
      return NextResponse.json(
        { error: 'Current idea is required' },
        { status: 400 }
      );
    }

    // Get past content
    const pastContent = await sql`
      SELECT idea, angle, platform, themes
      FROM content_history
      WHERE user_id = ${user.userId}
      ORDER BY posted_at DESC
      LIMIT 20
    `;

    // Analyze with AI
    const analysis = await analyzeContentHistory(
      pastContent.map((c) => ({
        idea: c.idea,
        angle: c.angle,
        platform: c.platform,
        themes: Array.isArray(c.themes) ? c.themes : undefined,
      })),
      currentIdea
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analyze content history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

