import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get all pickup requests
router.get('/', authenticate, async (req, res) => {
  try {
    const pickups = await prisma.pickupDelivery.findMany({
      include: { customer: true, courier: true, transaction: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pickups);
  } catch (error) {
    console.error('Get pickups error:', error);
    res.status(500).json({ error: 'Failed to fetch pickups' });
  }
});

// Get pickup by customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
  try {
    const pickups = await prisma.pickupDelivery.findMany({
      where: { customerId: req.params.customerId },
      include: { courier: true, transaction: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pickups' });
  }
});

// Create pickup request
router.post('/', authenticate, async (req, res) => {
  try {
    const { customerId, address, pickupDate, notes, transactionId, deliveryFee } = req.body;
    
    const pickup = await prisma.pickupDelivery.create({
      data: {
        customerId,
        address,
        pickupDate: new Date(pickupDate),
        notes,
        transactionId,
        deliveryFee: deliveryFee || 0,
        status: 'PENDING'
      },
      include: { customer: true }
    });
    
    res.status(201).json(pickup);
  } catch (error) {
    console.error('Create pickup error:', error);
    res.status(500).json({ error: 'Failed to create pickup request' });
  }
});

// Assign courier
router.patch('/:id/assign', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { courierId } = req.body;
    const pickup = await prisma.pickupDelivery.update({
      where: { id: req.params.id },
      data: { courierId, status: 'ASSIGNED' }
    });
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign courier' });
  }
});

// Update status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    const updateData: any = { status };
    if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
    
    const pickup = await prisma.pickupDelivery.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Cancel pickup
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const pickup = await prisma.pickupDelivery.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel pickup' });
  }
});

export default router;