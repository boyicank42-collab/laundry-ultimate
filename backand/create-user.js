const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Hash password admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Hashed password:', hashedPassword);
    
    // Buat user baru
    const user = await prisma.user.create({
      data: {
        username: 'boss',
        email: 'boss@laundry.com',
        password: hashedPassword,
        name: 'Boss Utama',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ User created:', user.username, user.id);
    console.log('✅ Password: admin123');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();