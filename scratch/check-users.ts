import { prisma } from '../lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    include: { goal: true },
  });
  console.log('Database Users Count:', users.length);
  users.forEach((u: { id: string; phone: string; goal?: { title: string } | null }) => {
    console.log(`ID: ${u.id} | Phone/Discord: ${u.phone} | Goal: ${u.goal?.title || 'None'}`);
  });
}

main().catch(console.error);
