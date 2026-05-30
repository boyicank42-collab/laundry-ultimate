import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const BACKUP_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

router.get('/list', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files.map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stats.size, createdAt: stats.birthtime };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get backups' });
  }
});

router.post('/create', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    const [customers, transactions, users, devices] = await Promise.all([
      prisma.customer.findMany(),
      prisma.transaction.findMany(),
      prisma.user.findMany(),
      prisma.device.findMany()
    ]);
    
    const backupData = { timestamp: new Date().toISOString(), customers, transactions, users, devices };
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    res.json({ success: true, backupName, size: fs.statSync(backupPath).size });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

router.get('/download/:filename', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.download(filePath);
});

router.delete('/:filename', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

export default router;