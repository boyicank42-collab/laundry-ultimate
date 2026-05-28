import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LICENSE_FILE = path.join(process.cwd(), 'license.key');
const HARDWARE_ID_FILE = path.join(process.cwd(), 'hardware.id');

// Generate hardware ID (based on MAC address + CPU + HDD)
export function getHardwareId(): string {
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
    
    const cpuInfo = os.cpus()[0]?.model || 'unknown';
    const totalMem = os.totalmem();
    const hostname = os.hostname();
    
    const hardwareString = `${macAddress}|${cpuInfo}|${totalMem}|${hostname}`;
    return crypto.createHash('sha256').update(hardwareString).digest('hex').substring(0, 32);
  } catch (error) {
    return crypto.randomBytes(16).toString('hex');
  }
}

// Save hardware ID
export function saveHardwareId(): string {
  const hardwareId = getHardwareId();
  fs.writeFileSync(HARDWARE_ID_FILE, hardwareId);
  return hardwareId;
}

// Generate license key
export function generateLicenseKey(packageType: string, customerName: string, expiryDate: string): string {
  const data = `${packageType}|${customerName}|${expiryDate}|${getHardwareId()}`;
  const signature = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  const licenseData = `${packageType}|${customerName}|${expiryDate}|${signature}`;
  return Buffer.from(licenseData).toString('base64');
}

// Verify license
export function verifyLicense(licenseKey: string): {
  valid: boolean;
  package?: string;
  customer?: string;
  expiry?: Date;
  message: string;
} {
  try {
    const decoded = Buffer.from(licenseKey, 'base64').toString();
    const [packageType, customerName, expiryDate, signature] = decoded.split('|');
    
    if (!packageType || !customerName || !expiryDate || !signature) {
      return { valid: false, message: 'Format lisensi tidak valid' };
    }
    
    // Verify expiry
    const expiry = new Date(expiryDate);
    if (expiry < new Date()) {
      return { valid: false, message: 'Lisensi sudah kadaluarsa' };
    }
    
    // Verify signature
    const hardwareId = getHardwareId();
    const data = `${packageType}|${customerName}|${expiryDate}|${hardwareId}`;
    const expectedSignature = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    
    if (signature !== expectedSignature) {
      return { valid: false, message: 'Lisensi tidak cocok dengan hardware ini' };
    }
    
    return {
      valid: true,
      package: packageType,
      customer: customerName,
      expiry,
      message: 'Lisensi valid'
    };
  } catch (error) {
    return { valid: false, message: 'Error membaca lisensi' };
  }
}

// Save license to file
export function saveLicense(licenseKey: string): void {
  fs.writeFileSync(LICENSE_FILE, licenseKey);
}

// Load license from file
export function loadLicense(): string | null {
  if (fs.existsSync(LICENSE_FILE)) {
    return fs.readFileSync(LICENSE_FILE, 'utf-8');
  }
  return null;
}

// Check if license exists and valid
export function isLicenseValid(): { valid: boolean; package?: string; message: string } {
  const license = loadLicense();
  if (!license) {
    return { valid: false, message: 'Belum ada lisensi' };
  }
  return verifyLicense(license);
}