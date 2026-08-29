import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

// Parse .env file manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0]?.trim();
      let value = parts.slice(1).join('=').trim();
      if (key && value) {
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

const token = process.env.DISCORD_BOT_TOKEN;

if (!token || token === 'your_discord_bot_token_here') {
  console.error('\n❌ Missing DISCORD_BOT_TOKEN in .env file!');
  process.exit(1);
}

// Import processDiscordBotMessage
import { processDiscordBotMessage } from '../lib/discord';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.on('ready', () => {
  console.log(`\n🎉 Discord AI Career Coach Bot is Live! Logged in as: ${client.user?.tag}`);
  console.log('📱 Users can now DM the bot or chat in servers to generate AI roadmaps!\n');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const discordUserId = `discord_${message.author.id}`;
  const userTag = message.author.tag;

  const attachments = message.attachments.map((a) => ({
    name: a.name,
    contentType: a.contentType,
    url: a.url,
  }));

  const replyFn = async (content: unknown) => {
    try {
      if (typeof content === 'string') {
        return await message.channel.send(content);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await message.channel.send(content as any);
    } catch (sendErr) {
      console.error('[Discord send error]:', sendErr);
      if (typeof content === 'string') {
        return await message.reply(content);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await message.reply(content as any);
    }
  };

  await processDiscordBotMessage(discordUserId, userTag, message.content, attachments, replyFn);
});

client.login(token).catch((err) => {
  console.error('❌ Failed to login Discord bot:', err.message);
});
