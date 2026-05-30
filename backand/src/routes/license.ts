import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Get all licenses
router.get('/', async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: licenses
    });
  } catch (error: any) {
    console.error('Error fetching licenses:', error);
    res.json({ 
      success: true, 
      data: [] 
    });
  }
});

// Get hardware ID
router.get('/hardware-id', async (req, res) => {
  try {
    const os = require('os');
    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    
    let hardwareId = 'HARDWARE-ID-DEFAULT';
    
    if (cpus && cpus.length > 0) {
      const cpuInfo = cpus[0].model;
      let macAddress = '';
      
      Object.values(networkInterfaces).forEach((interfaces: any) => {
        interfaces.forEach((iface: any) => {
          if (iface.mac && iface.mac !== '00:00:00:00:00:00' && !iface.internal) {
            macAddress = iface.mac;
          }
        });
      });
      
      const rawId = cpuInfo + macAddress + os.hostname();
      const hash = crypto.createHash('sha256').update(rawId).digest('hex');
      hardwareId = hash.substring(0, 32).toUpperCase();
    }
    
    res.json({
      success: true,
      hardwareId: hardwareId
    });
  } catch (error) {
    res.json({
      success: true,
      hardwareId: 'HARDWARE-ID-DEFAULT'
    });
  }
});

// Generate new license
router.post('/generate', async (req, res) => {
  try {
    const { packageType, customerName, expiryDate } = req.body;
    
    console.log('Generating license for:', { packageType, customerName, expiryDate });
    
    // Generate unique license key format: LIC-XXXX-XXXX-XXXX-XXXX
    const random1 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const random2 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const random3 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const random4 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const licenseKey = `LIC-${random1}-${random2}-${random3}-${random4}`;
    
    const license = await prisma.license.create({
      data: {
        licenseKey: licenseKey,
        packageType: packageType || 'ULTIMATE',
        customerName: customerName || 'PT SALSADILA MAHA KARYA',
        hardwareId: 'NOT-ACTIVATED',
        expiryDate: new Date(expiryDate || '2027-12-31'),
        isActive: false,
        activatedAt: null
      }
    });
    
    console.log('License created:', license.licenseKey);
    
    res.json({
      success: true,
      data: license,
      message: 'Lisensi berhasil dibuat'
    });
  } catch (error: any) {
    console.error('Error generating license:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Activate license
router.post('/activate', async (req, res) => {
  try {
    const { licenseKey, hardwareId } = req.body;
    
    console.log('Activating license:', licenseKey);
    
    const license = await prisma.license.findUnique({
      where: { licenseKey: licenseKey }
    });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Kode lisensi tidak ditemukan'
      });
    }
    
    if (license.expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Lisensi sudah kadaluarsa'
      });
    }
    
    if (license.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Lisensi sudah diaktifkan sebelumnya'
      });
    }
    
    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        hardwareId: hardwareId || 'HARDWARE-ID-DEFAULT',
        isActive: true,
        activatedAt: new Date()
      }
    });
    
    console.log('License activated:', license.licenseKey);
    
    res.json({
      success: true,
      data: updated,
      message: 'Lisensi berhasil diaktifkan'
    });
  } catch (error: any) {
    console.error('Error activating license:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete license
router.delete('/:id', async (req, res) => {
  try {
    await prisma.license.delete({
      where: { id: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Lisensi berhasil dihapus'
    });
  } catch (error: any) {
    console.error('Error deleting license:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check license validity (for customer)
router.post('/check', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    const license = await prisma.license.findUnique({
      where: { licenseKey: licenseKey }
    });
    
    if (!license) {
      return res.json({
        valid: false,
        message: 'Kode lisensi tidak valid'
      });
    }
    
    if (!license.isActive) {
      return res.json({
        valid: false,
        message: 'Lisensi belum diaktifkan'
      });
    }
    
    if (license.expiryDate < new Date()) {
      return res.json({
        valid: false,
        message: 'Lisensi sudah kadaluarsa'
      });
    }
    
    res.json({
      valid: true,
      data: {
        packageType: license.packageType,
        customerName: license.customerName,
        expiryDate: license.expiryDate
      },
      message: 'Lisensi valid'
    });
  } catch (error: any) {
    res.status(500).json({ 
      valid: false, 
      error: error.message 
    });
  }
});

export default router;