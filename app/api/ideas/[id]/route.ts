/**
 * Individual Idea API routes
 * PATCH /api/ideas/[id] - Update idea content
 * DELETE /api/ideas/[id] - Delete idea
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Update idea (only if owned by user)
    const result = await sql`
      UPDATE ideas
      SET content = ${content.trim()}
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING id, content, source, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Idea not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ idea: result[0] });
  } catch (error) {
    console.error('Update idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete idea (only if owned by user)
    const result = await sql`
      DELETE FROM ideas
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Idea not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
