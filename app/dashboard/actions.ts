'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
