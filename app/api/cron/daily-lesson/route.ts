import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDiscordMessage, getAppUrl } from '@/lib/discord';

export async function GET(req: NextRequest) {
  // Validate optional Vercel Cron Secret authorization header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron Daily Lesson] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron Daily Lesson] Executing daily lesson dispatch...');
    const appUrl = getAppUrl();

    // Find all users in ACTIVE_LEARNING state with their next uncompleted topic
    const activeUsers = await prisma.user.findMany({
      where: { botState: 'ACTIVE_LEARNING' },
      include: {
        goal: {
          include: {
            topics: {
              where: { isCompleted: false },
              orderBy: { dayNumber: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    const results = [];

    for (const user of activeUsers) {
      const nextTopic = user.goal?.topics?.[0];

      if (!nextTopic) {
        results.push({
          id: user.id,
          phone: user.phone,
          status: 'completed_all_topics',
        });
        continue;
      }

      const lessonMessage = `📚 **Daily AI Coaching - Day ${nextTopic.dayNumber}**\n\n📌 **${nextTopic.title}**\n\n${nextTopic.description}\n\n💡 **Action:** Click [ ✅ Mark Completed ] below or track your progress on the Web Dashboard (${appUrl}/dashboard)!`;

      // Pass nextTopic.id so Discord DM includes the interactive [ ✅ Mark Completed ] button
      const sent = await sendDiscordMessage(user.phone, lessonMessage, nextTopic.id);

      results.push({
        id: user.id,
        phone: user.phone,
        topicId: nextTopic.id,
        dayNumber: nextTopic.dayNumber,
        sentSuccess: sent,
      });
    }

    return NextResponse.json({
      success: true,
      processedUsersCount: activeUsers.length,
      details: results,
    });
  } catch (error) {
    console.error('[Cron Daily Lesson] Execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute daily lesson cron', details: String(error) },
      { status: 500 }
    );
  }
}
