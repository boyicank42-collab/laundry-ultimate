import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all ratings
router.get('/', authenticate, async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      include: { customer: true, transaction: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ratings);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get rating stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany();
    const total = ratings.length;
    const average = total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [0, 0, 0, 0, 0];
    ratings.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
    });
    res.json({ average, total, distribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create rating
router.post('/', authenticate, async (req, res) => {
  try {
    const { transactionId, rating, review } = req.body;
    const customerId = req.user?.id;
    
    const existing = await prisma.rating.findUnique({
      where: { transactionId }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already rated' });
    }
    
    const newRating = await prisma.rating.create({
      data: {
        transactionId,
        customerId,
        rating,
        review
      }
    });
    
    res.status(201).json(newRating);
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

export default router;