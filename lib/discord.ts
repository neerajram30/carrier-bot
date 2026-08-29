import { prisma } from './prisma';
import { extractTextFromPdf } from './pdf';
import { generateCareerRoadmap } from './ai';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Helper to sanitize process.env.DISCORD_BOT_TOKEN (stripping any accidental quotes)
function getCleanBotToken(): string {
  const raw = process.env.DISCORD_BOT_TOKEN || '';
  return raw.replace(/^["']|["']$/g, '').trim();
}

// Validate Discord User ID via Regex format AND live Discord REST API lookup
export async function validateDiscordUserId(input: string): Promise<{ isValid: boolean; rawUserId: string; username?: string; error?: string }> {
  const cleanInput = input.trim().replace(/^discord_/, '').replace(/^@/, '');

  if (!cleanInput) {
    return { isValid: false, rawUserId: '', error: 'Please enter a valid Discord User ID.' };
  }

  // 1. Regex validation for Discord Snowflake ID (17-19 numeric digits)
  if (!/^\d{17,19}$/.test(cleanInput)) {
    return {
      isValid: false,
      rawUserId: cleanInput,
      error: 'Invalid Discord User ID format. Discord User IDs are 17 to 19 numeric digits (e.g. 862658625750827028).',
    };
  }

  // 2. Real-time Discord REST API validation using sanitized Bot Token
  const botToken = getCleanBotToken();
  if (!botToken) {
    return { isValid: true, rawUserId: cleanInput };
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${cleanInput}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
    });

    if (res.status === 200) {
      const userData = await res.json();
      const name = userData.global_name || userData.username || cleanInput;
      return {
        isValid: true,
        rawUserId: cleanInput,
        username: name,
      };
    }

    if (res.status === 404) {
      return {
        isValid: false,
        rawUserId: cleanInput,
        error: `Discord User ID "${cleanInput}" does not exist on Discord. Please double check your Discord User ID.`,
      };
    }

    // If 401 or non-404 status (e.g. temporary API check issue), allow valid numeric Snowflake format
    console.warn(`[Discord Validation] Lookup returned HTTP ${res.status}, allowing format-verified ID`);
    return { isValid: true, rawUserId: cleanInput };
  } catch (err) {
    console.warn('[Discord Validation] Live API check warning, allowing format-verified ID:', err);
    return { isValid: true, rawUserId: cleanInput };
  }
}

// Send Discord DM via Discord REST API with optional Interactive Button
export async function sendDiscordMessage(
  discordUserId: string,
  message: string,
  topicId?: string
): Promise<boolean> {
  const botToken = getCleanBotToken();
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

    // 2. Prepare payload (Message Content + Interactive Button if topicId provided)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { content: message };

    if (topicId) {
      payload.components = [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 3, // Success / Green
              label: '✅ Mark Completed',
              custom_id: `mark_complete_${topicId}`,
            },
          ],
        },
      ];
    }

    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return msgRes.ok;
  } catch (error) {
    console.error('[Discord REST] Error sending message:', error);
    return false;
  }
}

// Process incoming Discord message logic (Interactive Intents + Gemini AI Tutor)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processDiscordBotMessage(discordUserId: string, userTag: string, content: string, attachments: any[], replyFn: (msg: any) => Promise<any>) {
  try {
    const rawContent = content.trim().toLowerCase();

    // Find User record in Prisma PostgreSQL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user: any = await prisma.user.findUnique({
      where: { phone: discordUserId },
      include: {
        goal: {
          include: {
            topics: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    });

    // -------------------------------------------------------------
    // INTERACTIVE QUERY INTENTS (No LLM required for Structural Data)
    // -------------------------------------------------------------

    // 1. "remaining" / "what are the remaining lessons"
    if (rawContent.includes('remaining') || rawContent.includes('left')) {
      if (!user || !user.goal || !user.goal.topics || user.goal.topics.length === 0) {
        await replyFn('ℹ️ You do not have an active career roadmap yet. Visit http://localhost:3000/onboarding to generate one!');
        return;
      }

      const uncompleted = user.goal.topics.filter((t: { isCompleted: boolean }) => !t.isCompleted);
      const total = user.goal.topics.length;
      const completed = total - uncompleted.length;
      const percent = Math.round((completed / total) * 100);

      if (uncompleted.length === 0) {
        await replyFn(`🎉 **Congratulations!** You have completed all **${total}** daily milestones in your career roadmap!\n\n📊 View your completed portfolio: http://localhost:3000/dashboard`);
        return;
      }

      const list = uncompleted
        .slice(0, 7)
        .map((t: { dayNumber: number; title: string }) => `* ⏳ **Day ${t.dayNumber}**: ${t.title}`)
        .join('\n');

      const extraCount = uncompleted.length > 7 ? `\n*...and ${uncompleted.length - 7} more topics*` : '';

      await replyFn(
        `📋 **Your Remaining Lessons (${uncompleted.length} Left):**\n\n${list}${extraCount}\n\n📊 **Progress**: ${completed}/${total} Completed (${percent}%)\n🔗 **Visual Web Dashboard**: http://localhost:3000/dashboard`
      );
      return;
    }

    // 2. "progress" / "status"
    if (rawContent === 'progress' || rawContent === 'status' || rawContent.includes('progress')) {
      if (!user || !user.goal || !user.goal.topics) {
        await replyFn('ℹ️ You do not have an active career roadmap. Create one on the web app: http://localhost:3000/onboarding');
        return;
      }

      const total = user.goal.topics.length;
      const completed = user.goal.topics.filter((t: { isCompleted: boolean }) => t.isCompleted).length;
      const percent = Math.round((completed / total) * 100);

      await replyFn(
        `🚀 **Active Goal**: ${user.goal.title}\n📈 **Progress**: ${completed} / ${total} Milestones Completed (**${percent}%**)\n📊 **Visual Web Dashboard**: http://localhost:3000/dashboard`
      );
      return;
    }

    // 3. "today" / "lesson"
    if (rawContent === 'today' || rawContent === 'lesson' || rawContent.includes('today')) {
      if (!user || !user.goal || !user.goal.topics) {
        await replyFn('ℹ️ No active roadmap found. Visit http://localhost:3000/onboarding to upload your resume!');
        return;
      }

      const nextTopic = user.goal.topics.find((t: { isCompleted: boolean }) => !t.isCompleted);
      if (!nextTopic) {
        await replyFn('🎉 All topics in your career roadmap are completed!');
        return;
      }

      const lessonMessage = `📚 **Today's AI Coaching Lesson - Day ${nextTopic.dayNumber}**\n\n📌 **${nextTopic.title}**\n\n${nextTopic.description}\n\n💡 **Action:** Complete today's milestone and track your progress on http://localhost:3000/dashboard`;

      await replyFn(lessonMessage);
      return;
    }

    // 4. "reset"
    if (rawContent === 'reset') {
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { botState: 'AWAITING_RESUME' },
        });
      }
      await replyFn('🔄 **Progress Reset.** Visit http://localhost:3000/onboarding to upload a new resume or generate a new career goal!');
      return;
    }

    // -------------------------------------------------------------
    // ONBOARDING / FILE UPLOAD FALLBACK (PDF Attachment parsing)
    // -------------------------------------------------------------

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: discordUserId,
          botState: 'AWAITING_RESUME',
        },
      });
    }

    const attachment = attachments?.[0];
    if (attachment && (attachment.name?.endsWith('.pdf') || attachment.contentType?.includes('pdf'))) {
      await replyFn('📄 Downloading and parsing your PDF resume... Please wait a moment.');

      const response = await fetch(attachment.url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const extractedText = await extractTextFromPdf(buffer);

      if (!extractedText || extractedText.trim().length === 0) {
        await replyFn('⚠️ Could not extract text from your PDF. Please re-upload a valid PDF resume.');
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resumeText: extractedText,
          botState: 'AWAITING_DURATION',
        },
      });

      await replyFn('📄 **Resume Parsed Successfully!**\n⏱️ **How many days or weeks** would you like your career roadmap to cover? (e.g. `14 days` or `4 weeks`)');
      return;
    }

    if (user.botState === 'AWAITING_DURATION') {
      const duration = content.trim() || '14 days';
      await prisma.user.update({
        where: { id: user.id },
        data: { targetDuration: duration, botState: 'AWAITING_GOALS' },
      });
      await replyFn(`⏱️ **Duration set to:** "${duration}"\n🎯 **What are your target career goals or target job role?**`);
      return;
    }

    if (user.botState === 'AWAITING_GOALS') {
      const goals = content.trim() || 'Senior Full Stack AI Engineer';
      await replyFn('🤖 **Analyzing your resume gap & generating your AI roadmap with Gemini...** Please wait ~10s.');

      const roadmap = await generateCareerRoadmap(user.resumeText || '', user.targetDuration || '14 days', goals);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          data: { botState: 'ACTIVE_LEARNING' },
        });
      });

      await replyFn(`🎉 **AI Career Roadmap Ready:** ${roadmap.goalTitle}\n\n📊 **Visual Web Dashboard:** http://localhost:3000/dashboard`);
      return;
    }

    // -------------------------------------------------------------
    // GENERATIVE AI TUTOR (Gemini 3.6 Flash for Free-form Questions)
    // -------------------------------------------------------------

    if (content.length > 3) {
      const activeTopic = user.goal?.topics?.find((t: { isCompleted: boolean }) => !t.isCompleted);
      const tutorPrompt = `
Candidate Question: "${content}"
Active Goal: "${user.goal?.title || 'Tech Upskilling'}"
Current Active Topic: "${activeTopic?.title || 'System Engineering'}"

Instructions:
Reply as an elite, encouraging AI Career & Technical Tutor. Keep your answer clear, engaging, formatted in clean Markdown, and under 300 words.
`;

      const aiResponse = await generateText({
        model: google('gemini-3.6-flash'),
        prompt: tutorPrompt,
      });

      await replyFn(`🤖 **AI Career Tutor:**\n\n${aiResponse.text}`);
      return;
    }

    await replyFn('👋 **Welcome to AI Career Coach!**\nCommands: `remaining`, `progress`, `today`, `reset` or ask any career question!');
  } catch (err) {
    console.error('[Discord Bot Error]', err);
    await replyFn('⚠️ An error occurred processing your request. Please try again.');
  }
}
