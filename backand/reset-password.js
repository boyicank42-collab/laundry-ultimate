import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const resetPassword = async () => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.update({
      where: { username: 'superadmin' },
      data: { password: hash }
    });
    
    console.log('✅ Password superadmin berhasil direset!');
    console.log('📝 Username: superadmin');
    console.log('📝 Password: admin123');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

resetPassword();