import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all memberships
router.get('/all', authenticate, async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      include: { 
        customer: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    });
    res.json(memberships);
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({ error: 'Failed to fetch memberships', details: error.message });
  }
});

// Get membership by customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
  try {
    let membership = await prisma.membership.findUnique({
      where: { customerId: req.params.customerId },
      include: { transactions: true }
    });
    
    if (!membership) {
      membership = await prisma.membership.create({
        data: { customerId: req.params.customerId, level: 'SILVER', points: 0, totalSpent: 0 }
      });
    }
    
    res.json(membership);
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({ error: 'Failed to get membership' });
  }
});

// Add points after transaction
router.post('/add-points', authenticate, async (req, res) => {
  try {
    const { customerId, transactionId, amount } = req.body;
    const pointsEarned = Math.floor(amount / 1000);
    
    let membership = await prisma.membership.findUnique({
      where: { customerId }
    });
    
    if (!membership) {
      membership = await prisma.membership.create({
        data: { customerId, level: 'SILVER', points: 0, totalSpent: 0 }
      });
    }
    
    const newPoints = membership.points + pointsEarned;
    const newTotalSpent = membership.totalSpent + amount;
    
    let level = membership.level;
    if (newTotalSpent >= 1000000) level = 'PLATINUM';
    else if (newTotalSpent >= 500000) level = 'GOLD';
    
    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { points: newPoints, totalSpent: newTotalSpent, level }
    });
    
    await prisma.membershipTransaction.create({
      data: {
        membershipId: membership.id,
        type: 'EARN',
        points: pointsEarned,
        description: `Transaksi ${transactionId} - Rp ${amount.toLocaleString()}`
      }
    });
    
    res.json({ updated, pointsEarned, newPoints, level });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

// Redeem points
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { customerId, points, transactionId } = req.body;
    
    const membership = await prisma.membership.findUnique({
      where: { customerId }
    });
    
    if (!membership || membership.points < points) {
      return res.status(400).json({ error: 'Insufficient points' });
    }
    
    const discount = points * 100;
    const newPoints = membership.points - points;
    
    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { points: newPoints }
    });
    
    await prisma.membershipTransaction.create({
      data: {
        membershipId: membership.id,
        type: 'REDEEM',
        points: -points,
        description: `Penukaran poin untuk transaksi ${transactionId} - Diskon Rp ${discount.toLocaleString()}`
      }
    });
    
    res.json({ updated, discount, newPoints });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
});

export default router;