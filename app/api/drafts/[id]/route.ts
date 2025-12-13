/**
 * Draft API route
 * GET /api/drafts/[id] - Get draft by ID
 * PATCH /api/drafts/[id] - Update draft (user edits)
 * DELETE /api/drafts/[id] - Delete draft
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

    const draftId = params.id;

    const result = await sql`
      SELECT id, content, platform, edited, created_at, updated_at
      FROM drafts
      WHERE id = ${draftId} AND user_id = ${user.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft: result[0] });
  } catch (error) {
    console.error('Get draft error:', error);
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

    const draftId = params.id;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Update draft
    const result = await sql`
      UPDATE drafts
      SET content = ${content},
          edited = true,
          updated_at = NOW()
      WHERE id = ${draftId} AND user_id = ${user.userId}
      RETURNING id, content, platform, edited, created_at, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft: result[0] });
  } catch (error) {
    console.error('Update draft error:', error);
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

    const draftId = params.id;

    const result = await sql`
      DELETE FROM drafts
      WHERE id = ${draftId} AND user_id = ${user.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


