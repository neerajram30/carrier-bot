'use server';

import { prisma } from '@/lib/prisma';
import { extractTextFromPdf } from '@/lib/pdf';
import { generateCareerRoadmap } from '@/lib/ai';
import { sendDiscordMessage, validateDiscordUserId } from '@/lib/discord';

export async function createRoadmapFromWeb(formData: FormData) {
  try {
    const file = formData.get('resume') as File | null;
    const targetDuration = (formData.get('targetDuration') as string) || '14 days';
    const userGoals = (formData.get('userGoals') as string) || 'Senior Full Stack AI Developer';
    const discordInput = (formData.get('discordUserId') as string)?.trim();

    if (!file || file.size === 0) {
      return { success: false, error: 'Please select a valid PDF resume file to upload.' };
    }

    const isExplicitDiscord = Boolean(discordInput);
    let discordUserId = `web_user_${Date.now()}`;

    if (isExplicitDiscord && discordInput) {
      const validation = await validateDiscordUserId(discordInput);
      if (!validation.isValid) {
        return { success: false, error: validation.error || 'Invalid Discord User ID' };
      }
      discordUserId = `discord_${validation.rawUserId}`;
    }

    // 1. Convert File to Buffer and extract PDF text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromPdf(buffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return { success: false, error: 'Could not extract text from the uploaded PDF resume. Please try a different PDF file.' };
    }

    // 2. Call Gemini 3.6 Flash AI to generate Career Gap Analysis & Structured Roadmap
    const roadmap = await generateCareerRoadmap(extractedText, targetDuration, userGoals);

    // 3. Save to Supabase PostgreSQL Database via Prisma Transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      let user = await tx.user.findUnique({
        where: { phone: discordUserId },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            phone: discordUserId,
            botState: 'ACTIVE_LEARNING',
            resumeText: extractedText,
            targetDuration,
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            botState: 'ACTIVE_LEARNING',
            resumeText: extractedText,
            targetDuration,
          },
        });

        // Clear existing goals for re-generation
        await tx.goal.deleteMany({ where: { userId: user.id } });
      }

      const newGoal = await tx.goal.create({
        data: {
          userId: user.id,
          title: roadmap.goalTitle,
          description: roadmap.goalDescription,
          roadmapSummary: roadmap.roadmapSummary,
        },
      });

      await tx.topic.createMany({
        data: roadmap.topics.map((t) => ({
          goalId: newGoal.id,
          dayNumber: t.dayNumber,
          title: t.title,
          description: t.description,
          isCompleted: false,
        })),
      });
    });

    // 4. Send Confirmation DM if user provided a Discord User ID
    if (isExplicitDiscord) {
      const confirmMsg = `🎉 **Welcome to Kunjappan AI Career Coach!**\n\nYour PDF resume has been analyzed and your custom **${roadmap.goalTitle}** roadmap is ready!\n\n📚 **Daily Reminders Enabled:**\n• You will receive automated daily lesson pushes in this DM.\n• Use **[ ✅ Mark Completed ]** buttons or reply **remaining** / **progress** anytime.\n\n📊 **Visual Web Dashboard:** http://localhost:3000/dashboard`;

      await sendDiscordMessage(discordUserId, confirmMsg);
    }

    return { success: true };
  } catch (error) {
    console.error('[createRoadmapFromWeb Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred generating your career roadmap.',
    };
  }
}
