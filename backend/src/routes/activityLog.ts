import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Middleware to log activity
export async function logActivity(userId: string, action: string, details: any, ip?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        ipAddress: ip || '',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

// Get all activity logs
router.get('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, userId, action, startDate, endDate } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    const logs = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, username: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });
    
    const total = await prisma.activityLog.count({ where });
    
    res.json({ logs, total, limit: Number(limit), offset: Number(offset) });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get activity summary
router.get('/summary', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [total, todayCount, weekCount, byAction] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({ where: { timestamp: { gte: today } } }),
      prisma.activityLog.count({ where: { timestamp: { gte: weekAgo } } }),
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      })
    ]);
    
    res.json({
      total,
      today: todayCount,
      week: weekCount,
      topActions: byAction.map(a => ({ action: a.action, count: a._count.action }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get user activity
router.get('/user/:userId', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.params.userId },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

export default router;