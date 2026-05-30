import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { month } = req.query;
    const startDate = new Date(month as string);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const costs = await prisma.operationalCost.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      orderBy: { date: 'desc' }
    });
    res.json(costs);
  } catch (error) {
    console.error('Get costs error:', error);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    console.log('📦 Received data:', JSON.stringify(req.body, null, 2));
    
    const { category, description, amount, date, outletId } = req.body;
    
    // Validasi data
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    const cost = await prisma.operationalCost.create({
      data: {
        category: category,
        description: description,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        outletId: outletId || '1'
      }
    });
    
    console.log('✅ Cost created:', cost.id);
    res.status(201).json(cost);
  } catch (error) {
    console.error('❌ Create cost error:', error);
    res.status(500).json({ error: 'Failed to create cost', details: error.message });
  }
});

router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;
    const cost = await prisma.operationalCost.update({
      where: { id: req.params.id },
      data: {
        category,
        description,
        amount: Number(amount),
        date: date ? new Date(date) : undefined
      }
    });
    res.json(cost);
  } catch (error) {
    console.error('Update cost error:', error);
    res.status(500).json({ error: 'Failed to update cost' });
  }
});

router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    await prisma.operationalCost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete cost error:', error);
    res.status(500).json({ error: 'Failed to delete cost' });
  }
});

export default router;