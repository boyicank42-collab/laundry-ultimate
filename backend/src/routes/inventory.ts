import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get all inventory items
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get single item
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.inventory.findUnique({
      where: { id: req.params.id }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Item not found' });
  }
});

// Create inventory item
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, category, stock, minStock, unit, price } = req.body;
    
    const item = await prisma.inventory.create({
      data: {
        name,
        category,
        stock: stock || 0,
        minStock: minStock || 10,
        unit: unit || 'kg',
        price: price || 0
      }
    });
    
    console.log(`✅ Inventory created: ${item.name}`);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Failed to create item', details: error.message });
  }
});

// Update inventory item
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, category, stock, minStock, unit, price } = req.body;
    
    const item = await prisma.inventory.update({
      where: { id: req.params.id },
      data: {
        name,
        category,
        stock,
        minStock,
        unit,
        price
      }
    });
    
    console.log(`✅ Inventory updated: ${item.name}`);
    res.json(item);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update item', details: error.message });
  }
});

// Delete inventory item
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    await prisma.inventory.delete({
      where: { id: req.params.id }
    });
    console.log(`✅ Inventory deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  }
});

export default router;