require('dotenv').config();
const { prisma } = require('./lib/prisma');

async function main() {
  const users = await prisma.user.findMany({
    include: { goal: true },
  });
  console.log('Database Users Count:', users.length);
  users.forEach((u) => {
    console.log(`ID: ${u.id} | Phone/Discord: ${u.phone} | Goal: ${u.goal?.title || 'None'}`);
  });
}

main().catch(console.error);
