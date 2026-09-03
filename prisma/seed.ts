import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.usuario.findUnique({
    where: { email: 'admin@csc.com' },
  });

  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 12);
    await prisma.usuario.create({
      data: {
        email: 'admin@csc.com',
        password: hashed,
        nombre: 'Administrador',
        rol: 'admin',
      },
    });
    console.log('Admin user created: admin@csc.com / admin123');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
