const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'daspayadmin';
  const plainPassword = 'paydasadmin';

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(plainPassword, salt);

    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: 'SUPERADMIN',
        name: 'Super Admin',
      }
    });
    console.log('SuperAdmin successfully created!');
  } else {
    console.log('SuperAdmin already exists.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
