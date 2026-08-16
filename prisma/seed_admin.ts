import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cleanai.com';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email }
  });

  if (existingAdmin) {
    console.log(`[Admin Seeder] Admin user with email ${email} already exists.`);
    return;
  }

  // Create new admin
  const tempPassword = 'CleanAIAdminSecurePass2026!';
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      email,
      phone: '+919999999900',
      firstName: 'CleanAI',
      lastName: 'Super Admin',
      passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      isPhoneVerified: true,
    }
  });

  console.log('[Admin Seeder] Admin user created successfully.');
  console.log(`[Admin Seeder] Email: ${adminUser.email}`);
  console.log(`[Admin Seeder] Temporary Password: ${tempPassword}`);
}

main()
  .catch((e) => {
    console.error('[Admin Seeder Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
