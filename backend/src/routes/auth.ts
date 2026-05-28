import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        outlet: user.outlet
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Seed admin
router.post('/seed', async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@laundry.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN',
        outlet: 'Pusat'
      }
    });
    res.json({ message: 'Admin seeded', admin });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

// ============ TWO FACTOR AUTHENTICATION ============

// Get 2FA status
router.get('/2fa/status', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { twoFactorEnabled: true }
    });
    res.json({ enabled: user?.twoFactorEnabled || false });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

// Setup 2FA (generate secret and QR code)
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const secret = speakeasy.generateSecret({
      name: `LaundryUltimate:${req.user!.username}`,
      length: 20
    });
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 }
    });
    
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    
    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true }
    });
    
    if (!user?.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not setup' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });
    
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

export default router;