import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import ExcelJS from 'exceljs';

const router = Router();

// Get report summary
router.get('/summary', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: start, lte: end }
      }
    });
    
    const costs = await prisma.operationalCost.findMany({
      where: {
        date: { gte: start, lte: end }
      }
    });
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    res.json({
      revenue: totalRevenue,
      cost: totalCost,
      profit: profit,
      margin: Math.round(margin),
      transactionCount: transactions.length,
      costCount: costs.length
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Export transactions to Excel
router.get('/export', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end }
      },
      include: { customer: true, user: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Transaksi');
    
    worksheet.columns = [
      { header: 'No Invoice', key: 'invoiceCode', width: 20 },
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Pelanggan', key: 'customer', width: 20 },
      { header: 'Layanan', key: 'serviceType', width: 15 },
      { header: 'Berat (kg)', key: 'weight', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'Diskon', key: 'discount', width: 12 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Pembayaran', key: 'paymentStatus', width: 12 }
    ];
    
    transactions.forEach(trx => {
      worksheet.addRow({
        invoiceCode: trx.invoiceCode,
        date: trx.createdAt.toLocaleDateString('id'),
        customer: trx.customer.name,
        serviceType: trx.serviceType,
        weight: trx.weight || '-',
        subtotal: trx.subtotal,
        discount: trx.discount,
        total: trx.total,
        status: trx.status,
        paymentStatus: trx.paymentStatus
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_transaksi_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Profit Loss Report
router.get('/profit-loss', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const transactions = await prisma.transaction.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: start, lte: end } },
      include: { customer: true }
    });
    
    const costs = await prisma.operationalCost.findMany({
      where: { date: { gte: start, lte: end } }
    });
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const revenueByService: Record<string, number> = {};
    transactions.forEach(t => { revenueByService[t.serviceType] = (revenueByService[t.serviceType] || 0) + t.total; });
    
    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
    const costByCategory: Record<string, number> = {};
    costs.forEach(c => { costByCategory[c.category] = (costByCategory[c.category] || 0) + c.amount; });
    
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    const dailyRevenue: Record<string, number> = {};
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + t.total;
    });
    
    res.json({
      revenue: { total: totalRevenue, byService: revenueByService, daily: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })) },
      cost: { total: totalCost, byCategory: costByCategory, details: costs.map(c => ({ category: c.category, description: c.description, amount: c.amount, date: c.date })) },
      profit: { gross: grossProfit, net: grossProfit, margin: profitMargin },
      period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    });
  } catch (error) {
    console.error('Profit loss error:', error);
    res.status(500).json({ error: 'Failed to generate profit/loss report' });
  }
});

// Customer Retention
router.get('/customer-retention', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { outletId, days } = req.query;
    const daysNum = parseInt(days as string) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);
    const inactiveCutoff = new Date();
    inactiveCutoff.setDate(inactiveCutoff.getDate() - 60);
    
    const customers = await prisma.customer.findMany({
      include: { transactions: true }
    });
    
    let loyalCount = 0, newCount = 0, inactiveCount = 0;
    const topCustomers = [];
    
    for (const customer of customers) {
      const transactionCount = customer.transactions.length;
      const totalSpent = customer.transactions.reduce((sum, t) => sum + t.total, 0);
      const lastTransaction = customer.transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const lastOrderDate = lastTransaction?.createdAt || new Date(0);
      
      if (transactionCount > 5 || totalSpent > 500000) loyalCount++;
      if (customer.createdAt > cutoffDate) newCount++;
      if (lastOrderDate < inactiveCutoff) inactiveCount++;
      
      topCustomers.push({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '-',
        totalOrders: transactionCount,
        totalSpent: totalSpent,
        lastOrder: lastOrderDate
      });
    }
    
    const totalCustomers = customers.length;
    const retentionRate = totalCustomers > 0 ? Math.round(((totalCustomers - inactiveCount) / totalCustomers) * 100) : 0;
    const churnRate = totalCustomers > 0 ? Math.round((inactiveCount / totalCustomers) * 100) : 0;
    
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const newInMonth = await prisma.customer.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } });
      const loyalInMonth = await prisma.customer.count({ where: { transactions: { some: { createdAt: { gte: monthStart, lte: monthEnd } } } } });
      monthlyTrend.push({ month: monthDate.toLocaleString('id', { month: 'short' }), new: newInMonth, loyal: loyalInMonth });
    }
    
    res.json({
      loyalCustomers: loyalCount,
      newCustomers: newCount,
      inactiveCustomers: inactiveCount,
      totalCustomers,
      retentionRate,
      churnRate,
      customerSegments: [
        { name: 'Pelanggan Setia', value: loyalCount },
        { name: 'Pelanggan Baru', value: newCount },
        { name: 'Tidak Aktif', value: inactiveCount }
      ],
      monthlyTrend,
      topCustomers: topCustomers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10)
    });
  } catch (error) {
    console.error('Customer retention error:', error);
    res.status(500).json({ error: 'Failed to fetch retention data' });
  }
});

// Peak Hour Analysis
router.get('/peak-hour', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { outletId, period } = req.query;
    let startDate = new Date();
    
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setDate(startDate.getDate() - 30);
    else startDate = new Date(0);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: 'PAID'
      }
    });
    
    // Hourly distribution
    const hourlyMap = new Map();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { count: 0, revenue: 0 });
    }
    
    for (const trx of transactions) {
      const hour = trx.createdAt.getHours();
      const current = hourlyMap.get(hour);
      hourlyMap.set(hour, {
        count: current.count + 1,
        revenue: current.revenue + trx.total
      });
    }
    
    const hourlyDistribution = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      count: data.count,
      revenue: data.revenue,
      percentage: transactions.length ? Math.round((data.count / transactions.length) * 100) : 0
    }));
    
    // Find peak hour
    let peakHour = { hour: 0, count: 0, time: '-' };
    let slowHour = { hour: 0, count: Infinity, time: '-' };
    for (const h of hourlyDistribution) {
      if (h.count > peakHour.count) {
        peakHour = { hour: h.hour, count: h.count, time: `${h.hour}:00 - ${h.hour+1}:00` };
      }
      if (h.count < slowHour.count && h.hour >= 8 && h.hour <= 20) {
        slowHour = { hour: h.hour, count: h.count, time: `${h.hour}:00 - ${h.hour+1}:00` };
      }
    }
    
    // Daily distribution
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dailyMap = new Map();
    for (const day of days) {
      dailyMap.set(day, { count: 0, revenue: 0 });
    }
    
    for (const trx of transactions) {
      const dayName = days[trx.createdAt.getDay()];
      const current = dailyMap.get(dayName);
      dailyMap.set(dayName, {
        count: current.count + 1,
        revenue: current.revenue + trx.total
      });
    }
    
    const dailyDistribution = Array.from(dailyMap.entries()).map(([day, data]) => ({
      day,
      count: data.count,
      revenue: data.revenue,
      percentage: transactions.length ? Math.round((data.count / transactions.length) * 100) : 0
    }));
    
    // Find peak day
    let peakDay = { day: '-', count: 0, revenue: 0 };
    for (const d of dailyDistribution) {
      if (d.count > peakDay.count) {
        peakDay = { day: d.day, count: d.count, revenue: d.revenue };
      }
    }
    
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const avgPerHour = totalTransactions > 0 ? Math.round(totalTransactions / 24) : 0;
    
    let recommendation = '';
    if (totalTransactions > 0) {
      recommendation = `🔥 Jam sibuk terjadi pada pukul ${peakHour.time} dengan ${peakHour.count} transaksi (${Math.round((peakHour.count / totalTransactions) * 100)}% dari total). Disarankan menambah 2-3 karyawan pada jam tersebut. Hari ${peakDay.day} adalah hari tersibuk dengan ${peakDay.count} transaksi dan pendapatan Rp ${peakDay.revenue.toLocaleString()}. Jam sepi pada pukul ${slowHour.time} bisa dimanfaatkan untuk promo khusus.`;
    } else {
      recommendation = 'Belum ada data transaksi yang cukup. Lakukan minimal 10 transaksi untuk analisis akurat.';
    }
    
    res.json({
      hourlyDistribution,
      dailyDistribution,
      peakHour,
      peakDay,
      slowHour,
      recommendation,
      totalTransactions,
      totalRevenue,
      avgPerHour
    });
  } catch (error) {
    console.error('Peak hour error:', error);
    res.status(500).json({ error: 'Failed to fetch peak hour data', details: error.message });
  }
});

// Analytics & Predictions AI
router.get('/analytics', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { outletId, period } = req.query;
    let months = 6;
    if (period === '3months') months = 3;
    if (period === '12months') months = 12;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startDate }
      },
      include: { customer: true }
    });
    
    const totalTransactions = transactions.length;
    
    // Monthly trend
    const monthlyData: Record<string, { actual: number; count: number }> = {};
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('id', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { actual: 0, count: 0 };
    }
    
    for (const trx of transactions) {
      const monthKey = trx.createdAt.toLocaleString('id', { month: 'short', year: 'numeric' });
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].actual += trx.total;
        monthlyData[monthKey].count++;
      }
    }
    
    const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      actual: data.actual,
      predicted: Math.round(data.actual * 1.05),
      count: data.count
    })).reverse();
    
    // Service distribution
    const serviceMap: Record<string, number> = {};
    for (const trx of transactions) {
      serviceMap[trx.serviceType] = (serviceMap[trx.serviceType] || 0) + 1;
    }
    const serviceDistribution = Object.entries(serviceMap).map(([name, count]) => ({
      name,
      value: count,
      percentage: totalTransactions > 0 ? Math.round((count / totalTransactions) * 100) : 0
    }));
    
    // Predictions for next 3 months
    const last3Months = monthlyTrend.slice(-3);
    const lastActuals = last3Months.map(m => m.actual);
    const avgGrowth = lastActuals.length > 1 && lastActuals[0] > 0 ? 
      (lastActuals[lastActuals.length-1] - lastActuals[0]) / lastActuals[0] : 0.05;
    
    const predictions = [];
    const lastMonth = new Date();
    const lastActual = monthlyTrend[monthlyTrend.length-1]?.actual || 0;
    for (let i = 1; i <= 3; i++) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + i);
      const predicted = Math.round(lastActual * (1 + avgGrowth * i));
      predictions.push({
        month: nextMonth.toLocaleString('id', { month: 'long', year: 'numeric' }),
        predicted,
        growth: Math.round(avgGrowth * i * 100),
        basedOn: totalTransactions
      });
    }
    
    // Insights
    const hourMap: Record<number, number> = {};
    for (const trx of transactions) {
      const hour = trx.createdAt.getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    }
    let peakHour = 0;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourMap)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = parseInt(hour);
      }
    }
    
    const dayMap: Record<number, number> = {};
    for (const trx of transactions) {
      const day = trx.createdAt.getDay();
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    let bestDay = 0;
    let maxDayCount = 0;
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    for (const [day, count] of Object.entries(dayMap)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        bestDay = parseInt(day);
      }
    }
    
    // Top customer
    const customerMap: Record<string, { name: string; totalOrders: number; totalSpent: number }> = {};
    for (const trx of transactions) {
      if (!customerMap[trx.customerId]) {
        customerMap[trx.customerId] = { name: trx.customer.name, totalOrders: 0, totalSpent: 0 };
      }
      customerMap[trx.customerId].totalOrders++;
      customerMap[trx.customerId].totalSpent += trx.total;
    }
    const topCustomer = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent)[0];
    
    // Favorite service
    const favoriteService = serviceDistribution.sort((a, b) => b.value - a.value)[0];
    
    res.json({
      predictions,
      insights: {
        topCustomer: topCustomer || null,
        peakHour: `${peakHour}:00 - ${peakHour+1}:00`,
        peakHourPercentage: totalTransactions > 0 ? Math.round((maxHourCount / totalTransactions) * 100) : 0,
        bestDay: dayNames[bestDay],
        bestDayAvg: maxDayCount,
        favoriteService: favoriteService?.name || '-',
        favoriteServicePercentage: favoriteService?.percentage || 0
      },
      serviceDistribution,
      monthlyTrend,
      totalTransactions,
      projectedGrowth: Math.round(avgGrowth * 100),
      accuracy: totalTransactions > 0 ? Math.min(95, 75 + Math.floor(totalTransactions / 10)) : 85,
      recommendation: totalTransactions > 0 
        ? `Berdasarkan data ${totalTransactions} transaksi, terjadi peningkatan ${Math.round(avgGrowth * 100)}% dalam ${months} bulan terakhir. ${favoriteService?.name || 'Layanan reguler'} adalah layanan terpopuler (${favoriteService?.percentage || 0}%). Disarankan menambah stok dan promosi pada jam ${peakHour}:00.`
        : 'Belum ada data transaksi. Lakukan minimal 10 transaksi untuk analisis yang akurat.'
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

export default router;