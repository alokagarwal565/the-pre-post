/**
 * Drafts API routes
 * POST /api/drafts - Generate draft
 * GET /api/drafts - Get user's drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
import { generateDraft } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drafts = await sql`
      SELECT 
        d.id,
        d.content,
        d.platform,
        d.edited,
        d.created_at,
        d.updated_at,
        cp.suggested_hook
      FROM drafts d
      JOIN content_plans cp ON d.content_plan_id = cp.id
      WHERE d.user_id = ${user.userId}
      ORDER BY d.updated_at DESC
    `;

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Get drafts error:', error);
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

    const { contentPlanId } = await request.json();

    if (!contentPlanId) {
      return NextResponse.json(
        { error: 'Content plan ID is required' },
        { status: 400 }
      );
    }

    // Get content plan and mind map
    const planResult = await sql`
      SELECT 
        cp.id,
        cp.platform,
        cp.suggested_hook,
        mm.tree
      FROM content_plans cp
      JOIN mind_maps mm ON cp.mind_map_id = mm.id
      WHERE cp.id = ${contentPlanId} AND cp.user_id = ${user.userId}
    `;

    if (planResult.length === 0) {
      return NextResponse.json(
        { error: 'Content plan not found' },
        { status: 404 }
      );
    }

    const plan = planResult[0];
    const tree = plan.tree as {
      coreIdea: string;
      supportingPoints: Array<{ point: string; examples: string[] }>;
      cta: string;
    };

    // Generate draft using AI (final step only)
    const draftContent = await generateDraft(
      tree,
      plan.platform as 'linkedin' | 'x' | 'blog',
      plan.suggested_hook || undefined
    );

    // Store draft
    const result = await sql`
      INSERT INTO drafts (content_plan_id, user_id, content, platform)
      VALUES (
        ${contentPlanId},
        ${user.userId},
        ${draftContent},
        ${plan.platform}
      )
      RETURNING id, content, platform, edited, created_at, updated_at
    `;

    return NextResponse.json({ draft: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Generate draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

