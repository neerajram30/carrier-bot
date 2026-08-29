import { NextRequest, NextResponse } from 'next/server';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import { processDiscordBotMessage } from '@/lib/discord';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const clientPublicKey = process.env.DISCORD_PUBLIC_KEY;

  const rawBody = await req.text();

  // Validate security signature if public key is configured
  if (clientPublicKey && signature && timestamp) {
    const isValid = verifyKey(rawBody, signature, timestamp, clientPublicKey);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const interaction = JSON.parse(rawBody);

  // 1. Handle Discord Verification PING
  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  // 2. Handle Application Command / Interactions
  if (interaction.type === InteractionType.APPLICATION_COMMAND || interaction.type === InteractionType.MESSAGE_COMPONENT) {
    const userId = interaction.member?.user?.id || interaction.user?.id || 'unknown';
    const userTag = interaction.member?.user?.username || interaction.user?.username || 'User';
    const discordUserId = `discord_${userId}`;

    const content = interaction.data?.options?.[0]?.value || interaction.data?.custom_id || '';
    const attachments = interaction.data?.resolved?.attachments ? Object.values(interaction.data.resolved.attachments) : [];

    let replyMessage = '';

    const replyFn = async (msg: unknown) => {
      if (typeof msg === 'string') {
        replyMessage += `${msg}\n`;
      } else {
        replyMessage += `${JSON.stringify(msg)}\n`;
      }
    };

    await processDiscordBotMessage(discordUserId, userTag, content, attachments, replyFn);

    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: replyMessage.trim() || 'Received!',
      },
    });
  }

  return NextResponse.json({ type: InteractionResponseType.PONG });
}
