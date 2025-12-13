/**
 * Mind Maps API routes
 * POST /api/mind-maps - Create mind map from refined idea
 * GET /api/mind-maps - Get user's mind maps
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
import { generateMindMap } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mindMaps = await sql`
      SELECT 
        mm.id,
        mm.tree,
        mm.selected_angle,
        mm.created_at,
        mm.updated_at,
        ri.clarified_idea
      FROM mind_maps mm
      JOIN refined_ideas ri ON mm.refined_idea_id = ri.id
      WHERE mm.user_id = ${user.userId}
      ORDER BY mm.updated_at DESC
    `;

    return NextResponse.json({ mindMaps });
  } catch (error) {
    console.error('Get mind maps error:', error);
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

    const { refinedIdeaId, selectedAngle } = await request.json();

    if (!refinedIdeaId) {
      return NextResponse.json(
        { error: 'Refined idea ID is required' },
        { status: 400 }
      );
    }

    // Get refined idea
    const refinedResult = await sql`
      SELECT id, clarified_idea, questions, angles, user_id
      FROM refined_ideas
      WHERE id = ${refinedIdeaId} AND user_id = ${user.userId}
    `;

    if (refinedResult.length === 0) {
      return NextResponse.json(
        { error: 'Refined idea not found' },
        { status: 404 }
      );
    }

    const refined = refinedResult[0];
    const questions = Array.isArray(refined.questions) ? refined.questions : [];

    // Check if mind map already exists
    const existing = await sql`
      SELECT id FROM mind_maps WHERE refined_idea_id = ${refinedIdeaId}
    `;

    if (existing.length > 0) {
      const existingMap = await sql`
        SELECT id, tree, selected_angle, created_at, updated_at
        FROM mind_maps
        WHERE refined_idea_id = ${refinedIdeaId}
      `;
      return NextResponse.json({ mindMap: existingMap[0] });
    }

    // Generate mind map using AI
    const mindMapTree = await generateMindMap(
      refined.clarified_idea,
      selectedAngle || refined.angles[0] || 'opinion',
      questions
    );

    // Store mind map
    const result = await sql`
      INSERT INTO mind_maps (refined_idea_id, user_id, tree, selected_angle)
      VALUES (
        ${refinedIdeaId},
        ${user.userId},
        ${JSON.stringify(mindMapTree)}::jsonb,
        ${selectedAngle || null}
      )
      RETURNING id, tree, selected_angle, created_at, updated_at
    `;

    return NextResponse.json({ mindMap: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Create mind map error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

