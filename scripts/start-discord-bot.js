const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Parse .env file
const envPath = path.join(__dirname, '..', '.env');
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
  console.log('\nHow to get a FREE Discord Bot Token (Takes 1 Minute):');
  console.log('1. Go to https://discord.com/developers/applications');
  console.log('2. Click "New Application" -> Name it (e.g. AI Career Coach)');
  console.log('3. Click "Bot" on left menu -> Click "Reset Token" -> Copy token');
  console.log('4. Enable "Message Content Intent" under Bot settings!');
  console.log('5. Paste DISCORD_BOT_TOKEN="your_token" in your .env file!\n');
  process.exit(1);
}

// Require compiled or transpiled processDiscordBotMessage
require('ts-node/register');
const { processDiscordBotMessage } = require('../lib/discord');

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
  console.log(`\n🎉 Discord AI Career Coach Bot is Live! Logged in as: ${client.user.tag}`);
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

  const replyFn = async (content) => {
    if (typeof content === 'string') {
      return message.reply({ content });
    }
    return message.reply(content);
  };

  await processDiscordBotMessage(discordUserId, userTag, message.content, attachments, replyFn);
});

client.login(token).catch((err) => {
  console.error('❌ Failed to login Discord bot:', err.message);
});
