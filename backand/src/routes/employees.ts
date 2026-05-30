import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all employees (tampilkan semua user kecuali super admin)
router.get('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { 
        username: { not: 'admin' }  // exclude super admin
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        outlet: true,
        shift: true,
        salary: true,
        username: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Create employee
router.post('/', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, email, phone, role, outlet, shift, salary } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const employee = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || '',
        role: role || 'KASIR',  // default KASIR jika tidak diisi
        outlet: outlet || 'Pusat',
        shift: shift || 'Pagi',
        salary: salary || 0,
        username: email,
        password: hashedPassword
      }
    });
    
    console.log(`✅ Employee created: ${employee.name} (${employee.role})`);
    res.status(201).json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      outlet: employee.outlet,
      shift: employee.shift,
      salary: employee.salary
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee', details: error.message });
  }
});

// Update employee
router.put('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, email, phone, role, outlet, shift, salary } = req.body;
    
    const employee = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        phone,
        role,
        outlet,
        shift,
        salary
      }
    });
    
    console.log(`✅ Employee updated: ${employee.name}`);
    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', authenticate, authorize('ADMIN', 'OWNER'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    console.log(`✅ Employee deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;