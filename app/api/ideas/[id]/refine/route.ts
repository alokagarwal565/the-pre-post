/**
 * Refine idea API route
 * POST /api/ideas/[id]/refine
 * AI thinking layer - refines raw idea into structured thinking
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
import { refineIdea } from '@/lib/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ideaId = params.id;

    // Get the raw idea
    const ideaResult = await sql`
      SELECT id, content, user_id
      FROM ideas
      WHERE id = ${ideaId} AND user_id = ${user.userId}
    `;

    if (ideaResult.length === 0) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const idea = ideaResult[0];

    // Check if already refined
    const existingRefined = await sql`
      SELECT id FROM refined_ideas WHERE idea_id = ${ideaId}
    `;

    if (existingRefined.length > 0) {
      // Return existing refined idea
      const refined = await sql`
        SELECT id, clarified_idea, questions, angles, created_at
        FROM refined_ideas
        WHERE idea_id = ${ideaId}
      `;
      return NextResponse.json({ refinedIdea: refined[0] });
    }

    // Call AI to refine the idea
    const refined = await refineIdea(idea.content);

    // Store refined idea
    const result = await sql`
      INSERT INTO refined_ideas (idea_id, user_id, clarified_idea, questions, angles)
      VALUES (
        ${ideaId},
        ${user.userId},
        ${refined.clarifiedIdea},
        ${JSON.stringify(refined.questions)}::jsonb,
        ${JSON.stringify(refined.angles)}::jsonb
      )
      RETURNING id, clarified_idea, questions, angles, created_at
    `;

    return NextResponse.json({ refinedIdea: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Refine idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

