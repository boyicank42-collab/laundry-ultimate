import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const customers = await prisma.customer.findMany({
      where,
      include: {
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { totalSpent: 'desc' }
    });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Customer not found' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;
    const customer = await prisma.customer.create({
      data: { name, phone, address, email }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, phone, address, email }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.customer.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;