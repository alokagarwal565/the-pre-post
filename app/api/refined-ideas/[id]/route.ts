/**
 * Individual Refined Idea API routes
 * DELETE /api/refined-ideas/[id] - Delete a refined idea
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

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
      SELECT id FROM refined_ideas
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Refined idea not found' },
        { status: 404 }
      );
    }

    // Delete the refined idea (this will cascade to mind_maps, content_plans, drafts)
    await sql`DELETE FROM refined_ideas WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete refined idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
