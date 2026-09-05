'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendDiscordMessage, validateDiscordUserId, getAppUrl } from '@/lib/discord';

export async function toggleTopicCompletion(topicId: string, currentStatus: boolean) {
  try {
    const updatedStatus = !currentStatus;

    await prisma.topic.update({
      where: { id: topicId },
      data: {
        isCompleted: updatedStatus,
        completedAt: updatedStatus ? new Date() : null,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, isCompleted: updatedStatus };
  } catch (error) {
    console.error('[Dashboard Action] Failed to toggle topic completion:', error);
    return { success: false, error: 'Failed to update topic status' };
  }
}

export async function resetUserProgress(userId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      // Find goal
      const goal = await tx.goal.findUnique({ where: { userId } });
      if (goal) {
        await tx.topic.updateMany({
          where: { goalId: goal.id },
          data: {
            isCompleted: false,
            completedAt: null,
          },
        });
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Dashboard Action] Failed to reset progress:', error);
    return { success: false, error: 'Failed to reset user progress' };
  }
}

export async function updateDiscordConnection(userId: string, discordInput: string) {
  try {
    // 1. Validate Discord User ID (Regex format + Live Discord REST API lookup)
    const validation = await validateDiscordUserId(discordInput);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'Invalid Discord User ID' };
    }

    const discordUserId = `discord_${validation.rawUserId}`;

    // 2. Check if another user record already has this discordUserId in PostgreSQL
    const existingUserWithPhone = await prisma.user.findUnique({
      where: { phone: discordUserId },
    });

    if (existingUserWithPhone && existingUserWithPhone.id !== userId) {
      // Re-link current goal to existing user record and remove temporary duplicate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.$transaction(async (tx: any) => {
        await tx.goal.deleteMany({ where: { userId: existingUserWithPhone.id } });
        await tx.goal.updateMany({
          where: { userId },
          data: { userId: existingUserWithPhone.id },
        });
        await tx.user.delete({ where: { id: userId } });
      });
    } else {
      // Update phone to discordUserId
      await prisma.user.update({
        where: { id: userId },
        data: { phone: discordUserId },
      });
    }

    // 3. Send instant confirmation DM to the verified Discord User
    const appUrl = getAppUrl();
    const confirmMsg = `🎉 **Discord Bot Reminders Connected!**\n\nHello ${validation.username ? `**${validation.username}**` : ''}! Your Discord account has been linked to your AI Career Roadmap.\n\n📚 **What to expect:**\n• Daily automated lesson pushes delivered to your DMs.\n• Interactive 1-click **[ ✅ Mark Completed ]** buttons.\n• Reply **remaining** anytime to see pending topics.\n• Reply **progress** to view your completion status.\n• Ask any technical or career question to consult your 24/7 Gemini AI Tutor!\n\n📊 **Visual Web Dashboard:** ${appUrl}/dashboard`;

    const sent = await sendDiscordMessage(discordUserId, confirmMsg);

    revalidatePath('/dashboard');
    return { success: true, sentDm: sent, username: validation.username };
  } catch (error) {
    console.error('[Dashboard Action] Failed to update Discord ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update Discord Connection ID',
    };
  }
}
