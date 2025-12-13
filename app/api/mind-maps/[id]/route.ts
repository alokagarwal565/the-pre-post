/**
 * Mind map API route
 * GET /api/mind-maps/[id] - Get mind map by ID
 * PATCH /api/mind-maps/[id] - Update mind map tree (user edits)
 * DELETE /api/mind-maps/[id] - Delete mind map
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mindMapId = params.id;

    const result = await sql`
      SELECT mm.id, mm.tree, mm.selected_angle, mm.created_at, mm.updated_at,
             ri.clarified_idea, ri.questions, ri.angles
      FROM mind_maps mm
      LEFT JOIN refined_ideas ri ON mm.refined_idea_id = ri.id
      WHERE mm.id = ${mindMapId} AND mm.user_id = ${user.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mindMap: result[0] });
  } catch (error) {
    console.error('Get mind map error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mindMapId = params.id;
    const { tree } = await request.json();

    if (!tree) {
      return NextResponse.json(
        { error: 'Tree is required' },
        { status: 400 }
      );
    }

    // Update mind map
    const result = await sql`
      UPDATE mind_maps
      SET tree = ${JSON.stringify(tree)}::jsonb,
          updated_at = NOW()
      WHERE id = ${mindMapId} AND user_id = ${user.userId}
      RETURNING id, tree, selected_angle, created_at, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mindMap: result[0] });
  } catch (error) {
    console.error('Update mind map error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM mind_maps
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    // Delete the mind map (this will cascade to content_plans, drafts)
    await sql`DELETE FROM mind_maps WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete mind map error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
