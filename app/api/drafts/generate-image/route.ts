import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateImage } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, platform } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const prompt = `Create a visually engaging social media image for ${platform || 'social media'}. 
The image should be professional, modern, and visually appealing.
Content theme: ${content.substring(0, 500)}

Style: Clean, professional, suitable for ${platform || 'social media'} posts. 
Use vibrant but professional colors. No text in the image.`;

    const { imageUrl, description } = await generateImage(prompt);

    return NextResponse.json({
      imageUrl,
      description,
    });
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
