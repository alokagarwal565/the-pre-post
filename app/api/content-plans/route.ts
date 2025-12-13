/**
 * Content Plans API routes
 * POST /api/content-plans - Create content plan
 * GET /api/content-plans - Get user's content plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
import { generateContentPlan } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await sql`
      SELECT 
        cp.id,
        cp.platform,
        cp.posting_frequency,
        cp.suggested_format,
        cp.suggested_day,
        cp.suggested_hook,
        cp.created_at,
        mm.tree
      FROM content_plans cp
      JOIN mind_maps mm ON cp.mind_map_id = mm.id
      WHERE cp.user_id = ${user.userId}
      ORDER BY cp.created_at DESC
    `;

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Get content plans error:', error);
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

    const { mindMapId, platform, postingFrequency } = await request.json();

    if (!mindMapId || !platform) {
      return NextResponse.json(
        { error: 'Mind map ID and platform are required' },
        { status: 400 }
      );
    }

    // Get mind map
    const mindMapResult = await sql`
      SELECT id, tree, user_id
      FROM mind_maps
      WHERE id = ${mindMapId} AND user_id = ${user.userId}
    `;

    if (mindMapResult.length === 0) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    const mindMap = mindMapResult[0];
    const tree = mindMap.tree as {
      coreIdea: string;
      supportingPoints: Array<{ point: string }>;
      cta: string;
    };

    // Generate content plan using AI
    const plan = await generateContentPlan(
      tree,
      platform as 'linkedin' | 'x' | 'blog',
      postingFrequency
    );

    // Store content plan
    const result = await sql`
      INSERT INTO content_plans (
        mind_map_id,
        user_id,
        platform,
        posting_frequency,
        suggested_format,
        suggested_day,
        suggested_hook
      )
      VALUES (
        ${mindMapId},
        ${user.userId},
        ${platform},
        ${postingFrequency || null},
        ${plan.suggestedFormat},
        ${plan.suggestedDay},
        ${plan.suggestedHook}
      )
      RETURNING id, platform, posting_frequency, suggested_format, suggested_day, suggested_hook, created_at
    `;

    return NextResponse.json({ plan: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Create content plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

