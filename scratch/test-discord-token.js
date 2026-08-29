require('dotenv').config();
const rawToken = process.env.DISCORD_BOT_TOKEN || '';
const token = rawToken.replace(/^["']|["']$/g, '').trim();

console.log('Raw Token length:', rawToken.length);
console.log('Clean Token:', token);

async function testFetch() {
  const res = await fetch('https://discord.com/api/v10/users/862658625750827028', {
    headers: {
      'Authorization': `Bot ${token}`,
    },
  });
  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Response Data:', data);
}

testFetch();
