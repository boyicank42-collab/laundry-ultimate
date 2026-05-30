import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const devices = [
    { name: 'Mesin Cuci 1', type: 'WASHER', outletId: '1', status: 'BUSY', cycle: 'Cuci Normal', timeRemaining: 15, temperature: 30 },
    { name: 'Mesin Cuci 2', type: 'WASHER', outletId: '1', status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Cuci 3', type: 'WASHER', outletId: '1', status: 'BUSY', cycle: 'Cuci Cepat', timeRemaining: 8, temperature: 40 },
    { name: 'Mesin Cuci 4', type: 'WASHER', outletId: '1', status: 'OFFLINE', cycle: 'Off', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Cuci 5', type: 'WASHER', outletId: '1', status: 'BUSY', cycle: 'Cuci Berat', timeRemaining: 22, temperature: 35 },
    { name: 'Mesin Cuci 6', type: 'WASHER', outletId: '1', status: 'MAINTENANCE', cycle: 'Servis', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Cuci 7', type: 'WASHER', outletId: '1', status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Dryer 1', type: 'DRYER', outletId: '1', status: 'BUSY', cycle: 'Kering Normal', timeRemaining: 12, temperature: 60 },
    { name: 'Mesin Dryer 2', type: 'DRYER', outletId: '1', status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Dryer 3', type: 'DRYER', outletId: '1', status: 'BUSY', cycle: 'Kering Cepat', timeRemaining: 5, temperature: 70 },
    { name: 'Mesin Dryer 4', type: 'DRYER', outletId: '1', status: 'OFFLINE', cycle: 'Off', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Dryer 5', type: 'DRYER', outletId: '1', status: 'BUSY', cycle: 'Kering Ekstra', timeRemaining: 28, temperature: 65 },
    { name: 'Mesin Dryer 6', type: 'DRYER', outletId: '1', status: 'MAINTENANCE', cycle: 'Servis', timeRemaining: 0, temperature: 0 },
    { name: 'Mesin Dryer 7', type: 'DRYER', outletId: '1', status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0 },
  ];

  for (const device of devices) {
    await prisma.device.create({ 
      data: { ...device, lastMaintenance: new Date() } 
    });
  }
  
  console.log('✅ 14 devices seeded successfully!');
  process.exit();
}

seed();