import { prisma } from './prisma';
import { extractTextFromPdf } from './pdf';
import { generateCareerRoadmap } from './ai';

// Send Discord DM via Discord REST API (no native binary dependencies needed for Next.js App Router)
export async function sendDiscordMessage(discordUserId: string, message: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('[Discord REST] DISCORD_BOT_TOKEN is missing in env');
    return false;
  }

  const rawUserId = discordUserId.replace('discord_', '');

  try {
    // 1. Create DM channel with user
    const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: rawUserId }),
    });

    if (!channelRes.ok) {
      console.error('[Discord REST] Failed to open DM channel:', channelRes.status);
      return false;
    }

    const channel = await channelRes.json();

    // 2. Send message to DM channel
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
    });

    return msgRes.ok;
  } catch (error) {
    console.error('[Discord REST] Error sending message:', error);
    return false;
  }
}

// Process incoming Discord message logic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processDiscordBotMessage(discordUserId: string, userTag: string, content: string, attachments: any[], replyFn: (msg: any) => Promise<any>) {
  try {
    let user: any = await prisma.user.findUnique({
      where: { phone: discordUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: discordUserId,
          botState: 'AWAITING_RESUME',
        },
      });
      console.log(`[Discord Bot] Created user ${userTag} (${discordUserId})`);
    }

    switch (user.botState) {
      case 'AWAITING_RESUME': {
        const attachment = attachments?.[0];

        if (attachment && (attachment.name?.endsWith('.pdf') || attachment.contentType?.includes('pdf'))) {
          await replyFn('📄 Downloading and parsing your PDF resume... Please wait a moment.');

          const response = await fetch(attachment.url);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const extractedText = await extractTextFromPdf(buffer);

          if (!extractedText || extractedText.trim().length === 0) {
            await replyFn('⚠️ Could not extract readable text from your PDF. Please re-upload a valid PDF resume.');
            break;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              resumeText: extractedText,
              botState: 'AWAITING_DURATION',
            },
          });

          await replyFn('📄 **Resume Parsed Successfully!**\n⏱️ **How many days or weeks** would you like your career roadmap to cover? (e.g. `14 days` or `4 weeks`)');
        } else {
          await replyFn('👋 **Welcome to AI Career Coach!**\nPlease attach and upload your resume as a **PDF document** (`.pdf`) to begin your AI gap analysis.');
        }
        break;
      }

      case 'AWAITING_DURATION': {
        const duration = content.trim() || '14 days';

        await prisma.user.update({
          where: { id: user.id },
          data: {
            targetDuration: duration,
            botState: 'AWAITING_GOALS',
          },
        });

        await replyFn(`⏱️ **Duration set to:** "${duration}"\n🎯 **What are your target career goals, target job role, or specific skills you want to master?**`);
        break;
      }

      case 'AWAITING_GOALS': {
        const goals = content.trim() || 'Master tech role skills and system design';

        await replyFn('🤖 **Analyzing your resume gap & generating your AI career roadmap with Gemini...** Please wait ~10s.');

        const roadmap = await generateCareerRoadmap(
          user.resumeText || '',
          user.targetDuration || '14 days',
          goals
        );

        await prisma.$transaction(async (tx: any) => {
          await tx.goal.deleteMany({ where: { userId: user.id } });

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

          await tx.user.update({
            where: { id: user.id },
            data: {
              botState: 'ACTIVE_LEARNING',
            },
          });
        });

        await replyFn(`🎉 **AI Career Roadmap Ready:** ${roadmap.goalTitle}\n\n📝 **Summary:** ${roadmap.goalDescription}\n\n📊 **Visual Web Dashboard:** http://localhost:3000/dashboard\n\n📅 *Your daily lesson pushes will be delivered directly to your Discord DMs!*`);
        break;
      }

      case 'ACTIVE_LEARNING': {
        if (content.trim().toLowerCase() === 'reset') {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              botState: 'AWAITING_RESUME',
              resumeText: null,
              targetDuration: null,
            },
          });
          await replyFn('🔄 **Account reset.** Send a new PDF resume attachment to create a new career roadmap!');
        } else {
          await replyFn('🚀 **AI Career Plan Active!**\nYour daily lessons are sent automatically. You can review topics and track progress on your Web Dashboard: http://localhost:3000/dashboard');
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[Discord Bot Error]', err);
    await replyFn('⚠️ An error occurred processing your request. Please try again.');
  }
}
