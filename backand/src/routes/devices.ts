import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get all devices
router.get('/', authenticate, async (req, res) => {
  try {
    const devices = await prisma.device.findMany({
      include: { logs: { take: 10, orderBy: { timestamp: 'desc' } } }
    });
    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get single device
router.get('/:id', authenticate, async (req, res) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: { logs: { orderBy: { timestamp: 'desc' } } }
    });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Device not found' });
  }
});

// Create device
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, type, outletId } = req.body;
    const device = await prisma.device.create({
      data: { name, type, outletId, cycle: 'Siap', lastMaintenance: new Date() }
    });
    res.status(201).json(device);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// UPDATE device
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, type, outletId } = req.body;
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { name, type, outletId }
    });
    res.json(device);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// DELETE device
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    await prisma.deviceLog.deleteMany({ where: { deviceId: req.params.id } });
    await prisma.device.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Start device
// Start device - duration dalam DETIK
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const { cycleType, duration, temperature } = req.body;
    // duration sudah dalam detik dari frontend (15 menit = 900 detik)
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: {
        status: 'BUSY',
        cycle: cycleType,
        timeRemaining: duration, // dalam detik
        temperature: temperature,
        currentLoad: 7
      }
    });
    await prisma.deviceLog.create({
      data: { deviceId: req.params.id, action: 'start', duration: duration }
    });
    console.log(`✅ Device ${device.name} started for ${duration} seconds`);
    res.json(device);
  } catch (error) {
    console.error('Start device error:', error);
    res.status(500).json({ error: 'Failed to start device' });
  }
});

// Stop device
router.post('/:id/stop', authenticate, async (req, res) => {
  try {
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0, currentLoad: 0 }
    });
    await prisma.deviceLog.create({
      data: { deviceId: req.params.id, action: 'stop', duration: 0 }
    });
    res.json(device);
  } catch (error) {
    console.error('Stop device error:', error);
    res.status(500).json({ error: 'Failed to stop device' });
  }
});

// Power on (offline -> online)
router.post('/:id/poweron', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0, currentLoad: 0 }
    });
    res.json(device);
  } catch (error) {
    console.error('Power on error:', error);
    res.status(500).json({ error: 'Failed to power on device' });
  }
});

// Repair device
router.post('/:id/repair', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { 
        status: 'ONLINE', 
        cycle: 'Siap', 
        timeRemaining: 0, 
        temperature: 0, 
        currentLoad: 0, 
        lastMaintenance: new Date() 
      }
    });
    await prisma.deviceLog.create({
      data: { deviceId: req.params.id, action: 'maintenance', duration: 0 }
    });
    res.json(device);
  } catch (error) {
    console.error('Repair error:', error);
    res.status(500).json({ error: 'Failed to repair device' });
  }
});

// UPDATE timer manually
router.put('/:id/timer', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { timeRemaining, status, cycle, temperature } = req.body;
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { 
        timeRemaining: timeRemaining || 0,
        status: status || 'ONLINE',
        cycle: cycle || 'Siap',
        temperature: temperature || 0
      }
    });
    res.json(device);
  } catch (error) {
    console.error('Update timer error:', error);
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

// UPDATE ALL TIMERS (called by cron)
router.post('/update-timers', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const busyDevices = await prisma.device.findMany({
      where: { status: 'BUSY', timeRemaining: { gt: 0 } }
    });
    
    let updated = 0;
    let finished = 0;
    
    for (const device of busyDevices) {
      const newTime = device.timeRemaining - 1;
      if (newTime <= 0) {
        await prisma.device.update({
          where: { id: device.id },
          data: { 
            status: 'ONLINE', 
            cycle: 'Siap', 
            timeRemaining: 0, 
            temperature: 0, 
            currentLoad: 0 
          }
        });
        finished++;
        console.log(`✅ [TIMER] ${device.name} FINISHED!`);
      } else {
        await prisma.device.update({
          where: { id: device.id },
          data: { timeRemaining: newTime }
        });
        updated++;
      }
    }
    
    res.json({ success: true, updated, finished });
  } catch (error) {
    console.error('Update timers error:', error);
    res.status(500).json({ error: 'Failed to update timers' });
  }
});

// Get device logs
router.get('/:id/logs', authenticate, async (req, res) => {
  try {
    const logs = await prisma.deviceLog.findMany({
      where: { deviceId: req.params.id },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;