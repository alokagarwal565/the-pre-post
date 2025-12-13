/**
 * Mark draft as posted API route
 * POST /api/drafts/[id]/post 
 * - Multi-step process:
 * 1. Fetch draft info + metadata (idea, angle)
 * 2. Archive to content_history
 * 3. Delete from drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const draftId = params.id;

    // 1. Fetch draft and related metadata
    // We need: draft details, mind map angle, refined idea summary
    const draftData = await sql`
      SELECT 
        d.id, d.content, d.platform,
        mm.selected_angle,
        ri.clarified_idea
      FROM drafts d
      JOIN content_plans cp ON d.content_plan_id = cp.id
      JOIN mind_maps mm ON cp.mind_map_id = mm.id
      JOIN refined_ideas ri ON mm.refined_idea_id = ri.id
      WHERE d.id = ${draftId} AND d.user_id = ${user.userId}
    `;

    if (draftData.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    const draft = draftData[0];

    // 2. Ensure content_history has 'content' column
    // This is a runtime migration check to support storing the full post
    try {
      await sql`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_history' AND column_name='content') THEN
            ALTER TABLE content_history ADD COLUMN content TEXT;
          END IF;
        END $$;
      `;
    } catch (err) {
      console.warn('Failed to check/add content column, proceeding anyway:', err);
    }

    // 3. Insert into content_history
    // Note: We map 'clarified_idea' to 'idea' column as per schema intent (topic tracking)
    // And store actual post text in new 'content' column
    const historyResult = await sql`
      INSERT INTO content_history (
        user_id, 
        idea, 
        angle, 
        platform, 
        content,
        posted_at
      )
      VALUES (
        ${user.userId}, 
        ${draft.clarified_idea}, 
        ${draft.selected_angle || 'default'}, 
        ${draft.platform}, 
        ${draft.content},
        NOW()
      )
      RETURNING id
    `;

    // 4. Delete the draft
    await sql`
      DELETE FROM drafts 
      WHERE id = ${draftId} AND user_id = ${user.userId}
    `;

    return NextResponse.json({ 
      success: true, 
      historyId: historyResult[0].id 
    });

  } catch (error) {
    console.error('Mark as posted error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
