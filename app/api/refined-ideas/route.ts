/**
 * Refined Ideas API routes
 * GET /api/refined-ideas - Get user's refined ideas
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

    const refinedIdeas = await sql`
      SELECT 
        ri.id,
        ri.clarified_idea,
        ri.questions,
        ri.angles,
        ri.created_at,
        i.id as idea_id,
        i.content as original_idea
      FROM refined_ideas ri
      JOIN ideas i ON ri.idea_id = i.id
      WHERE ri.user_id = ${user.userId}
      ORDER BY ri.created_at DESC
    `;

    return NextResponse.json({ refinedIdeas });
  } catch (error) {
    console.error('Get refined ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
