import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { format, subDays } from 'date-fns';

const router = Router();

router.get('/advanced', authenticate, async (req, res) => {
  try {
    const { outletId, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    // Daily revenue
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: 'PAID'
      },
      include: { customer: true }
    });
    
    // Group by date
    const dailyRevenue: Record<string, number> = {};
    transactions.forEach(t => {
      const date = format(t.createdAt, 'yyyy-MM-dd');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + t.total;
    });
    
    const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));
    
    // Service distribution
    const serviceDistribution: Record<string, number> = {};
    transactions.forEach(t => {
      serviceDistribution[t.serviceType] = (serviceDistribution[t.serviceType] || 0) + 1;
    });
    
    const serviceDistributionArray = Object.entries(serviceDistribution).map(([name, value]) => ({ name, value }));
    
    // Outlet comparison (mock)
    const outletComparison = [
      { name: 'Outlet Pusat', revenue: transactions.filter(t => true).reduce((sum, t) => sum + t.total, 0) },
      { name: 'Outlet Cabang', revenue: Math.floor(transactions.filter(t => true).reduce((sum, t) => sum + t.total, 0) * 0.6) }
    ];
    
    res.json({
      totalCustomers: await prisma.customer.count(),
      totalTransactions: transactions.length,
      totalRevenue: transactions.reduce((sum, t) => sum + t.total, 0),
      pendingOrders: await prisma.transaction.count({ where: { status: 'PENDING' } }),
      dailyRevenue: dailyRevenueArray,
      serviceDistribution: serviceDistributionArray,
      outletComparison,
      recentTransactions: transactions.slice(-10).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch advanced dashboard' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [totalCustomers, totalTransactions, totalRevenue, todayTransactions, pendingOrders] = await Promise.all([
      prisma.customer.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
      prisma.transaction.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.transaction.count({ where: { status: { in: ['PENDING', 'PROGRESS'] } } })
    ]);
    
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, user: true }
    });
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { paymentStatus: 'PAID', createdAt: { gte: sixMonthsAgo } },
      _sum: { total: true }
    });
    
    res.json({
      totalCustomers,
      totalTransactions,
      totalRevenue: totalRevenue._sum.total || 0,
      todayTransactions,
      pendingOrders,
      recentTransactions,
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.createdAt.toLocaleString('id', { month: 'short' }),
        revenue: item._sum.total || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;