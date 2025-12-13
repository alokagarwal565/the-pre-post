/**
 * Suggest posting time API route
 * POST /api/drafts/[id]/suggest-time - Get AI suggestion for best posting time
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

// Platform-specific optimal posting times
const platformOptimalTimes = {
  linkedin: {
    days: ['Tuesday', 'Wednesday', 'Thursday'],
    times: ['8:00 AM', '10:00 AM', '12:00 PM'],
    timezone: 'local',
  },
  x: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    times: ['12:00 PM', '1:00 PM', '3:00 PM', '5:00 PM'],
    timezone: 'local',
  },
  blog: {
    days: ['Tuesday', 'Thursday'],
    times: ['10:00 AM', '11:00 AM'],
    timezone: 'local',
  },
};

function getNextOptimalTime(platform: string): { date: string; day: string; time: string } {
  const config = platformOptimalTimes[platform as keyof typeof platformOptimalTimes] || platformOptimalTimes.linkedin;
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Find the next optimal day
  let daysToAdd = 1;
  let targetDay = '';
  
  for (let i = 1; i <= 7; i++) {
    const futureDay = (currentDay + i) % 7;
    const futureDayName = dayNames[futureDay];
    if (config.days.includes(futureDayName)) {
      daysToAdd = i;
      targetDay = futureDayName;
      break;
    }
  }
  
  // Calculate the target date
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysToAdd);
  
  // Pick a random optimal time
  const optimalTime = config.times[Math.floor(Math.random() * config.times.length)];
  
  return {
    date: targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    day: targetDay,
    time: optimalTime,
  };
}

function generateGoogleCalendarUrl(title: string, date: string, time: string, description: string): string {
  // Parse the date and time
  const dateObj = new Date(`${date} ${time}`);
  
  // Format for Google Calendar (YYYYMMDDTHHmmss)
  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const startTime = formatDate(dateObj);
  const endTime = formatDate(new Date(dateObj.getTime() + 30 * 60 * 1000)); // 30 minutes later
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startTime}/${endTime}`,
    details: description,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

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

    // Get the draft to determine platform and content
    const result = await sql`
      SELECT id, content, platform
      FROM drafts
      WHERE id = ${draftId} AND user_id = ${user.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    const draft = result[0];
    const { date, day, time } = getNextOptimalTime(draft.platform);
    
    // Create Google Calendar URL
    const calendarTitle = `Post ${draft.platform} content`;
    const calendarDescription = draft.content.substring(0, 200) + (draft.content.length > 200 ? '...' : '');
    const calendarUrl = generateGoogleCalendarUrl(calendarTitle, date, time, calendarDescription);

    return NextResponse.json({
      suggestion: {
        date,
        day,
        time,
        calendarUrl,
      },
    });
  } catch (error) {
    console.error('Suggest time error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
