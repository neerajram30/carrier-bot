import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const RoadmapSchema = z.object({
  goalTitle: z.string().describe('Short overarching title for the candidate career goal'),
  goalDescription: z.string().describe('Executive summary of career gap analysis and key skill acquisition target'),
  roadmapSummary: z.string().describe('High-level breakdown of curriculum phases'),
  topics: z.array(
    z.object({
      dayNumber: z.number().int().positive().describe('Sequential day number starting from 1'),
      title: z.string().describe('Actionable, engaging topic header for notification'),
      description: z.string().describe('Comprehensive daily lesson payload including concepts, key takeaways, and a quick practical exercise'),
    })
  ),
});

export type RoadmapOutput = z.infer<typeof RoadmapSchema>;

// Dynamically resolve Google Provider with quote stripping & multi-env key fallback
export function getGoogleProvider() {
  const rawKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ||
    '';

  const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();

  if (!apiKey) {
    const matchingKeys = Object.keys(process.env)
      .filter((k) => k.includes('GOOGLE') || k.includes('GEMINI') || k.includes('KEY'))
      .join(', ');

    throw new Error(
      `Google Generative AI API Key is missing. Environment keys detected: [${matchingKeys || 'none'}]. ` +
        `IMPORTANT: After adding or editing environment variables on Vercel, you MUST click 'Redeploy' on Vercel for the changes to take effect.`
    );
  }

  return createGoogleGenerativeAI({ apiKey });
}

export async function generateCareerRoadmap(
  resumeText: string,
  targetDuration: string,
  userGoals: string
): Promise<RoadmapOutput> {
  const googleProvider = getGoogleProvider();
  const model = googleProvider('gemini-3.6-flash');

  const prompt = `
Candidate Resume Extract:
"""
${resumeText.length > 8000 ? resumeText.slice(0, 8000) + '...[truncated]' : resumeText}
"""

Target Learning Timeline / Duration: ${targetDuration}
Candidate Career Objectives & Desired Role: ${userGoals}

Instructions:
1. Conduct a rigorous skill gap analysis comparing the resume to the target career goals.
2. Formulate an overarching Goal Title and Description.
3. Divide the target duration into discrete daily topics (day 1, day 2, day 3... up to the requested timeframe, e.g. 7 days for 1 week, 14 days for 2 weeks, 30 days for 1 month).
4. Ensure each daily topic has a crystal-clear title and an enriched description tailored for daily lesson pushes.
`;

  const { object } = await generateObject({
    model,
    schema: RoadmapSchema,
    system: `You are an elite AI Executive Career & Upskilling Coach. You build actionable, high-converting, micro-learning roadmaps customized for ambitious professionals.`,
    prompt,
  });

  return object;
}
