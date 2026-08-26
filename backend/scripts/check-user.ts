import { prisma } from '../src/config/prisma';

async function main() {
  const users = await prisma.user.findMany({ where: { email: { contains: 'ankur' } } });
  console.log('ANKUR RECORDS FOUND:', users.length);
  for (const u of users) {
    console.log(JSON.stringify({ id: u.id, email: u.email, username: u.username, isActive: u.isActive, isSuspended: u.isSuspended, role: u.role, twoFactorEnabled: u.twoFactorEnabled }, null, 2));
  }
  await prisma.$disconnect();
}

main().catch(console.error);
