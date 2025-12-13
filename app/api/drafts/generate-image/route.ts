/**
 * Generate image for draft API route
 * POST /api/drafts/generate-image - Generate an image for the draft content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

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

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Create a prompt for image generation based on the content
    const imagePrompt = `Create a visually engaging social media image for ${platform || 'social media'}. 
The image should be professional, modern, and visually appealing.
Content theme: ${content.substring(0, 500)}

Style: Clean, professional, suitable for ${platform || 'social media'} posts. 
Use vibrant but professional colors. No text in the image.`;

    // Use Google's Gemini model for image generation via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'The Pre-Post',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Generate a detailed description for an image that would be perfect for this social media post:\n\n${content.substring(0, 500)}\n\nDescribe the image in detail including colors, composition, and visual elements. The image should be professional and engaging.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate image description' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const imageDescription = data.choices?.[0]?.message?.content || 'A professional social media image';

    // For now, return a placeholder image URL since actual image generation
    // requires specific image generation models. We'll use a placeholder service.
    // In production, you would integrate with DALL-E, Stable Diffusion, or similar.
    
    // Use Pollinations.ai to generate a relevant image based on the description
    // This allows actual image generation that matches the content
    const encodedPrompt = encodeURIComponent(imageDescription);
    const placeholderUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    return NextResponse.json({
      imageUrl: placeholderUrl,
      description: imageDescription,
    });
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
