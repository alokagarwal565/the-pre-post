/**
 * Content History API routes
 * GET /api/content-history - Get user's content history
 * POST /api/content-history - Add to history (after posting)
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

    const history = await sql`
      SELECT id, idea, angle, platform, posted_at, themes
      FROM content_history
      WHERE user_id = ${user.userId}
      ORDER BY posted_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get content history error:', error);
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

    const { idea, angle, platform, themes } = await request.json();

    if (!idea || !angle || !platform) {
      return NextResponse.json(
        { error: 'Idea, angle, and platform are required' },
        { status: 400 }
      );
    }

    // Prepare themes as JSONB
    const themesValue = themes ? JSON.stringify(themes) : null;

    const result = themesValue
      ? await sql`
          INSERT INTO content_history (user_id, idea, angle, platform, themes)
          VALUES (
            ${user.userId},
            ${idea},
            ${angle},
            ${platform},
            ${themesValue}::jsonb
          )
          RETURNING id, idea, angle, platform, posted_at, themes
        `
      : await sql`
          INSERT INTO content_history (user_id, idea, angle, platform, themes)
          VALUES (
            ${user.userId},
            ${idea},
            ${angle},
            ${platform},
            NULL
          )
          RETURNING id, idea, angle, platform, posted_at, themes
        `;

    return NextResponse.json({ entry: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Add content history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

