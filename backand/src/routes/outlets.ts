import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = Router();

// Get all outlets
router.get('/', authenticate, async (req, res) => {
  try {
    const outlets = await prisma.outlet.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(outlets);
  } catch (error) {
    console.error('Get outlets error:', error);
    res.status(500).json({ error: 'Failed to fetch outlets' });
  }
});

// Get single outlet
router.get('/:id', authenticate, async (req, res) => {
  try {
    const outlet = await prisma.outlet.findUnique({
      where: { id: req.params.id }
    });
    res.json(outlet);
  } catch (error) {
    res.status(500).json({ error: 'Outlet not found' });
  }
});

// Create outlet
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, address, phone, manager } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }
    
    const outlet = await prisma.outlet.create({
      data: {
        name,
        address,
        phone: phone || '',
        manager: manager || ''
      }
    });
    
    console.log(`✅ Outlet created: ${outlet.name}`);
    res.status(201).json(outlet);
  } catch (error) {
    console.error('Create outlet error:', error);
    res.status(500).json({ error: 'Failed to create outlet', details: error.message });
  }
});

// Update outlet
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, address, phone, manager } = req.body;
    const { id } = req.params;
    
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }
    
    const outlet = await prisma.outlet.update({
      where: { id },
      data: {
        name,
        address,
        phone: phone || '',
        manager: manager || ''
      }
    });
    
    console.log(`✅ Outlet updated: ${outlet.name}`);
    res.json(outlet);
  } catch (error) {
    console.error('Update outlet error:', error);
    res.status(500).json({ error: 'Failed to update outlet', details: error.message });
  }
});

// Delete outlet
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.outlet.delete({ where: { id } });
    console.log(`✅ Outlet deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Delete outlet error:', error);
    res.status(500).json({ error: 'Failed to delete outlet', details: error.message });
  }
});

export default router;