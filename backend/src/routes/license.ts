import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const router = Router();
const LICENSE_FILE = path.join(process.cwd(), 'license.key');

// Get hardware ID
function getHardwareId(): string {
  try {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let macAddress = '';
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          macAddress = iface.mac;
          break;
        }
      }
      if (macAddress) break;
    }
    
    return crypto.createHash('sha256').update(macAddress + os.hostname()).digest('hex').substring(0, 16);
  } catch (error) {
    return 'HARDWARE-ID-DEFAULT';
  }
}

// Generate license (admin)
router.post('/generate', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { packageType, customerName, expiryDate } = req.body;
    const hardwareId = getHardwareId();
    const data = `${packageType}|${customerName}|${expiryDate}|${hardwareId}`;
    const signature = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    const licenseData = `${packageType}|${customerName}|${expiryDate}|${signature}`;
    const licenseKey = Buffer.from(licenseData).toString('base64');
    
    // Save to file
    fs.writeFileSync(LICENSE_FILE, licenseKey);
    
    res.json({ 
      success: true, 
      licenseKey, 
      packageType, 
      customerName, 
      expiryDate,
      message: 'Lisensi berhasil dibuat dan diaktifkan'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate license' });
  }
});

// Activate license - LANGSUNG SUKSES
router.post('/activate', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    if (licenseKey) {
      fs.writeFileSync(LICENSE_FILE, licenseKey);
    } else {
      // Generate default license
      const defaultKey = Buffer.from('ULTIMATE|Laundry Ultimate|2027-12-31|default').toString('base64');
      fs.writeFileSync(LICENSE_FILE, defaultKey);
    }
    
    res.json({ 
      success: true, 
      package: 'ULTIMATE',
      customer: 'Laundry Ultimate',
      expiry: new Date('2027-12-31'),
      message: 'Lisensi berhasil diaktifkan'
    });
  } catch (error) {
    res.json({ success: true, message: 'Lisensi aktif' });
  }
});

// Check status - SELALU AKTIF
router.get('/status', async (req, res) => {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      const licenseKey = fs.readFileSync(LICENSE_FILE, 'utf-8');
      const decoded = Buffer.from(licenseKey, 'base64').toString();
      const parts = decoded.split('|');
      
      res.json({
        active: true,
        package: parts[0] || 'ULTIMATE',
        customer: parts[1] || 'Laundry Ultimate',
        expiry: parts[2] ? new Date(parts[2]) : new Date('2027-12-31'),
        message: 'Lisensi aktif'
      });
    } else {
      // Create default license file
      const defaultKey = Buffer.from('ULTIMATE|Laundry Ultimate|2027-12-31|default').toString('base64');
      fs.writeFileSync(LICENSE_FILE, defaultKey);
      
      res.json({
        active: true,
        package: 'ULTIMATE',
        customer: 'Laundry Ultimate',
        expiry: new Date('2027-12-31'),
        message: 'Lisensi aktif'
      });
    }
  } catch (error) {
    res.json({ active: true, package: 'ULTIMATE', message: 'Lisensi aktif' });
  }
});

router.get('/hardware-id', async (req, res) => {
  res.json({ hardwareId: getHardwareId() });
});

export default router;