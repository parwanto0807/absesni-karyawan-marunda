const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password123', // In production, use high-security hashing like bcrypt
      name: 'Administrator Marunda',
      role: 'ADMIN',
      employeeId: 'ADM-001',
    },
  });

  const security = await prisma.user.upsert({
    where: { username: 'sec01' },
    update: {},
    create: {
      username: 'sec01',
      password: 'password123',
      name: 'Security Utama',
      role: 'SECURITY',
      employeeId: 'SEC-001',
    },
  });

  // Settings Kantot
  await prisma.setting.upsert({
    where: { key: 'OFFICE_NAME' },
    update: { value: 'Marunda Center' },
    create: { key: 'OFFICE_NAME', value: 'Marunda Center' }
  });

  await prisma.setting.upsert({
    where: { key: 'OFFICE_LAT' },
    update: { value: '-6.251426' },
    create: { key: 'OFFICE_LAT', value: '-6.251426' }
  });

  await prisma.setting.upsert({
    where: { key: 'OFFICE_LNG' },
    update: { value: '107.113798' },
    create: { key: 'OFFICE_LNG', value: '107.113798' }
  });

  await prisma.setting.upsert({
    where: { key: 'ALLOWED_RADIUS' },
    update: { value: '100' },
    create: { key: 'ALLOWED_RADIUS', value: '100' }
  });

  console.log({ admin, security });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
