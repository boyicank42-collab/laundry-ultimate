import { Request, Response } from 'express';
import { prisma } from '../index.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const outletId = req.query.outletId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Filter berdasarkan outlet
    const whereClause: any = {};
    if (outletId) {
      whereClause.outletId = outletId;
    }
    
    // Filter tanggal (jika ada)
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59')
      };
    }
    
    // Ambil semua transaksi
    const allTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        customer: true,
        outlet: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Hitung statistik dari transaksi yang paymentStatus LUNAS
    const paidTransactions = allTransactions.filter(t => t.paymentStatus === 'LUNAS');
    const totalRevenue = paidTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = allTransactions.length;
    
    // Transaksi hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = allTransactions.filter(t => new Date(t.createdAt) >= today);
    const todayRevenue = todayTransactions
      .filter(t => t.paymentStatus === 'LUNAS')
      .reduce((sum, t) => sum + t.total, 0);
    
    // Pending order: transaksi yang paymentStatus-nya 'PENDING' atau 'BELUM BAYAR'
    const pendingOrders = allTransactions.filter(t => 
      t.paymentStatus === 'PENDING' || t.paymentStatus === 'BELUM BAYAR'
    ).length;
    
    // Total pelanggan unik
    const uniqueCustomers = await prisma.transaction.groupBy({
      by: ['customerId'],
      where: whereClause,
      _count: { customerId: true }
    });
    
    // DAILY REVENUE untuk chart (group by tanggal)
    const dailyRevenueMap = new Map<string, { revenue: number; count: number }>();
    
    allTransactions.forEach(t => {
      if (t.paymentStatus === 'LUNAS') {
        const dateKey = t.createdAt.toISOString().split('T')[0];
        const existing = dailyRevenueMap.get(dateKey) || { revenue: 0, count: 0 };
        dailyRevenueMap.set(dateKey, {
          revenue: existing.revenue + t.total,
          count: existing.count + 1
        });
      }
    });
    
    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, data]) => ({ date, revenue: data.revenue, count: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Outlet comparison
    const outletStats = await prisma.transaction.groupBy({
      by: ['outletId'],
      where: whereClause,
      _sum: { total: true },
      _count: { id: true }
    });
    
    const outlets = await prisma.outlet.findMany();
    const outletComparison = outletStats.map(stat => {
      const outlet = outlets.find(o => o.id === stat.outletId);
      return {
        name: outlet?.name || 'Unknown',
        revenue: stat._sum.total || 0,
        count: stat._count.id
      };
    });
    
    // Service distribution
    const serviceDistribution = [
      { name: 'KILOAN', value: allTransactions.filter(t => t.serviceType === 'KILOAN').length },
      { name: 'SATUAN', value: allTransactions.filter(t => t.serviceType === 'SATUAN').length },
      { name: 'BEDCOVER', value: allTransactions.filter(t => t.serviceType === 'BEDCOVER').length },
      { name: 'SEPATU', value: allTransactions.filter(t => t.serviceType === 'SEPATU').length },
      { name: 'EXPRESS', value: allTransactions.filter(t => t.serviceType === 'EXPRESS').length }
    ].filter(s => s.value > 0);
    
    // Recent transactions untuk ditampilkan di dashboard
    const recentTransactions = allTransactions.slice(0, 10).map(t => ({
      id: t.id,
      invoice: t.invoice,
      invoiceCode: t.invoice,
      customerName: t.customer?.name || 'Pelanggan',
      total: t.total,
      paymentStatus: t.paymentStatus,
      status: t.status,
      createdAt: t.createdAt
    }));
    
    res.json({
      success: true,
      data: {
        totalCustomers: uniqueCustomers.length,
        totalTransactions: totalTransactions,
        totalRevenue: totalRevenue,
        todayTransactions: todayTransactions.length,
        todayRevenue: todayRevenue,
        pendingOrders: pendingOrders,
        dailyRevenue: dailyRevenue,
        outletComparison: outletComparison,
        serviceDistribution: serviceDistribution,
        recentTransactions: recentTransactions
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getRevenueChart = async (req: Request, res: Response) => {
  try {
    const outletId = req.query.outletId as string;
    const days = parseInt(req.query.days as string) || 30;
    
    const whereClause: any = {};
    if (outletId) whereClause.outletId = outletId;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: startDate },
        paymentStatus: 'LUNAS'
      },
      orderBy: { createdAt: 'asc' }
    });
    
    const chartData: { date: string; revenue: number; count: number }[] = [];
    const dateMap = new Map<string, { revenue: number; count: number }>();
    
    transactions.forEach(t => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { revenue: 0, count: 0 };
      dateMap.set(dateKey, {
        revenue: existing.revenue + t.total,
        count: existing.count + 1
      });
    });
    
    dateMap.forEach((value, key) => {
      chartData.push({ date: key, revenue: value.revenue, count: value.count });
    });
    
    res.json({
      success: true,
      data: chartData
    });
    
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};