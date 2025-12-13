/**
 * AI Service Layer for The Pre-Post
 * Uses OpenRouter API with model selection per task
 * 
 * Model Selection Strategy:
 * - Reasoning/Planning: claude-3.5-sonnet (strong reasoning, structured output)
 * - Refining/Thinking: claude-3.5-sonnet (clear thinking, question generation)
 * - Writing/Drafting: gpt-4-turbo (high-quality writing, platform-aware)
 */

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call OpenRouter API with specified model
 */
async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number = 0.7,
  responseFormat?: { type: 'json_object' }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'The Pre-Post',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(responseFormat && { response_format: responseFormat }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Refine an idea - AI thinking layer
 * Model: claude-3.5-sonnet (excellent at reasoning and structured thinking)
 */
export async function refineIdea(rawIdea: string): Promise<{
  clarifiedIdea: string;
  questions: string[];
  angles: string[];
}> {
  const prompt = `You are a thinking partner for content creators. Your job is to help clarify ideas, not write content.

Raw idea from user:
"${rawIdea}"

Your task:
1. Restate the idea clearly and concisely (1-2 sentences)
2. Generate 2-3 thoughtful questions that help the creator think deeper
3. Suggest 2-4 content angles: opinion, story, teaching, or contrarian

Be intelligent, not verbose. Focus on clarity and thinking, not writing.

Respond in JSON format:
{
  "clarifiedIdea": "clear restatement",
  "questions": ["question 1", "question 2", "question 3"],
  "angles": ["angle1", "angle2", "angle3"]
}`;

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a thoughtful thinking partner. You help clarify ideas and suggest angles, never write content.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await callOpenRouter(
    'anthropic/claude-3.5-sonnet', // Strong reasoning model
    messages,
    0.7,
    { type: 'json_object' }
  );

  try {
    const parsed = JSON.parse(response);
    return {
      clarifiedIdea: parsed.clarifiedIdea || rawIdea,
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      angles: Array.isArray(parsed.angles) ? parsed.angles : [],
    };
  } catch (error) {
    // Fallback if JSON parsing fails
    return {
      clarifiedIdea: rawIdea,
      questions: ['What is the core message?', 'Who is this for?'],
      angles: ['opinion', 'teaching'],
    };
  }
}

/**
 * Generate mind map structure from refined idea
 * Model: claude-3.5-sonnet (structured thinking)
 */
export async function generateMindMap(
  clarifiedIdea: string,
  selectedAngle: string,
  questions: string[]
): Promise<{
  coreIdea: string;
  supportingPoints: Array<{ point: string; examples: string[] }>;
  cta: string;
}> {
  const prompt = `Convert this refined idea into a structured mind map.

Clarified Idea: "${clarifiedIdea}"
Selected Angle: "${selectedAngle}"
Thinking Questions: ${questions.join(', ')}

Create a mind map structure with:
1. Core idea (one clear sentence)
2. 3-5 supporting points (each with 1-2 brief examples)
3. A clear call-to-action

Respond in JSON format:
{
  "coreIdea": "core idea sentence",
  "supportingPoints": [
    {
      "point": "supporting point 1",
      "examples": ["example 1", "example 2"]
    }
  ],
  "cta": "call to action"
}`;

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You create structured thinking maps. Focus on clarity and organization.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await callOpenRouter(
    'anthropic/claude-3.5-sonnet', // Structured thinking
    messages,
    0.7,
    { type: 'json_object' }
  );

  try {
    const parsed = JSON.parse(response);
    return {
      coreIdea: parsed.coreIdea || clarifiedIdea,
      supportingPoints: Array.isArray(parsed.supportingPoints)
        ? parsed.supportingPoints
        : [],
      cta: parsed.cta || '',
    };
  } catch (error) {
    return {
      coreIdea: clarifiedIdea,
      supportingPoints: [],
      cta: '',
    };
  }
}

/**
 * Analyze content history for repetition and missing perspectives
 * Model: claude-3.5-sonnet (pattern detection, reasoning)
 */
export async function analyzeContentHistory(
  pastContent: Array<{ idea: string; angle: string; platform: string; themes?: string[] }>,
  currentIdea: string
): Promise<{
  repetitionFlags: string[];
  missingPerspectives: string[];
  suggestions: string[];
}> {
  if (pastContent.length === 0) {
    return {
      repetitionFlags: [],
      missingPerspectives: [],
      suggestions: [],
    };
  }

  const historySummary = pastContent
    .map((c) => `- ${c.idea} (${c.angle}, ${c.platform})`)
    .join('\n');

  const prompt = `Analyze this content history and current idea for repetition and missing perspectives.

Past Content:
${historySummary}

Current Idea: "${currentIdea}"

Identify:
1. Any repetitive themes or overused angles
2. Missing perspectives or angles not yet explored
3. Suggestions for fresh approaches

Respond in JSON:
{
  "repetitionFlags": ["flag 1", "flag 2"],
  "missingPerspectives": ["perspective 1", "perspective 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You analyze content patterns and suggest fresh perspectives.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await callOpenRouter(
    'anthropic/claude-3.5-sonnet', // Pattern analysis
    messages,
    0.5, // Lower temperature for more consistent analysis
    { type: 'json_object' }
  );

  try {
    const parsed = JSON.parse(response);
    return {
      repetitionFlags: Array.isArray(parsed.repetitionFlags) ? parsed.repetitionFlags : [],
      missingPerspectives: Array.isArray(parsed.missingPerspectives)
        ? parsed.missingPerspectives
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (error) {
    return {
      repetitionFlags: [],
      missingPerspectives: [],
      suggestions: [],
    };
  }
}

/**
 * Generate content plan - decision support
 * Model: claude-3.5-sonnet (strategic thinking, decision support)
 */
export async function generateContentPlan(
  mindMap: { coreIdea: string; supportingPoints: Array<{ point: string }>; cta: string },
  platform: 'linkedin' | 'x' | 'blog',
  postingFrequency?: string
): Promise<{
  suggestedFormat: string;
  suggestedDay: string;
  suggestedHook: string;
}> {
  const mindMapSummary = `Core: ${mindMap.coreIdea}\nPoints: ${mindMap.supportingPoints.map((p) => p.point).join(', ')}`;

  const prompt = `Provide decision support for content planning. Do NOT write the content, only suggest strategy.

Mind Map:
${mindMapSummary}

Platform: ${platform}
Posting Frequency: ${postingFrequency || 'not specified'}

Suggest:
1. Best format for this platform (e.g., "carousel", "thread", "long-form", "short hook")
2. Best posting day (consider platform norms)
3. Best hook style (e.g., "question", "statement", "story", "data")

Respond in JSON:
{
  "suggestedFormat": "format suggestion",
  "suggestedDay": "day suggestion",
  "suggestedHook": "hook style"
}`;

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You provide strategic content planning advice. You suggest formats and timing, never write content.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await callOpenRouter(
    'anthropic/claude-3.5-sonnet', // Strategic thinking
    messages,
    0.6,
    { type: 'json_object' }
  );

  try {
    const parsed = JSON.parse(response);
    return {
      suggestedFormat: parsed.suggestedFormat || '',
      suggestedDay: parsed.suggestedDay || '',
      suggestedHook: parsed.suggestedHook || '',
    };
  } catch (error) {
    return {
      suggestedFormat: '',
      suggestedDay: '',
      suggestedHook: '',
    };
  }
}

/**
 * Generate caption draft - final step only
 * Model: gpt-4-turbo (high-quality writing, platform-aware)
 */
export async function generateDraft(
  mindMap: { coreIdea: string; supportingPoints: Array<{ point: string; examples: string[] }>; cta: string },
  platform: 'linkedin' | 'x' | 'blog',
  hookStyle?: string
): Promise<string> {
  const mindMapDetails = `
Core Idea: ${mindMap.coreIdea}
Supporting Points:
${mindMap.supportingPoints.map((p, i) => `${i + 1}. ${p.point}${p.examples.length > 0 ? ` (Examples: ${p.examples.join(', ')})` : ''}`).join('\n')}
CTA: ${mindMap.cta}
`;

  const platformGuidelines = {
    linkedin: 'Professional tone, 1300-3000 characters, thoughtful insights, can use 1-2 emojis sparingly',
    x: 'Concise, punchy, 280 characters or less, engaging, can use emojis appropriately',
    blog: 'Long-form, 800-2000 words, detailed, no emojis',
  };

  const prompt = `Write a ${platform} ${hookStyle ? `post with a ${hookStyle} hook` : 'post'} based on this mind map.

${mindMapDetails}

Platform Guidelines: ${platformGuidelines[platform]}

IMPORTANT RULES:
1. Write ONLY the actual post content - no introductions, no meta-commentary, no conclusions about the content
2. Do NOT include phrases like "Feel free to use this...", "This content is designed for...", "Here's the post...", etc.
3. Do NOT use any markdown formatting - no asterisks (*), no bold (**), no italics, no headers (#)
4. Write plain text only, suitable for direct posting on ${platform}
5. Start directly with the hook and end with the CTA - nothing before or after

Write the actual post content now:`;

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a skilled content writer. Write ${platform} posts that are engaging, clear, and platform-appropriate. Output ONLY the post content itself - no meta-commentary, no markdown formatting. Plain text only.`,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await callOpenRouter(
    'openai/gpt-4-turbo', // High-quality writing model
    messages,
    0.8 // Higher temperature for more creative writing
  );

  // Clean up any remaining markdown or unwanted patterns
  let cleanedResponse = response.trim();
  
  // Remove markdown bold/italic formatting
  cleanedResponse = cleanedResponse.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove **bold**
  cleanedResponse = cleanedResponse.replace(/\*([^*]+)\*/g, '$1'); // Remove *italic*
  cleanedResponse = cleanedResponse.replace(/__([^_]+)__/g, '$1'); // Remove __bold__
  cleanedResponse = cleanedResponse.replace(/_([^_]+)_/g, '$1'); // Remove _italic_
  cleanedResponse = cleanedResponse.replace(/^#+\s*/gm, ''); // Remove markdown headers
  
  // Remove common filler phrases at the end
  const fillerPatterns = [
    /---[\s\S]*$/,
    /Feel free to[\s\S]*$/i,
    /This content[\s\S]*$/i,
    /Use this[\s\S]*$/i,
    /Here's the[\s\S]*$/i,
  ];
  
  for (const pattern of fillerPatterns) {
    cleanedResponse = cleanedResponse.replace(pattern, '').trim();
  }

  return cleanedResponse;
}

