import { Router } from 'express';
import { prisma } from '../index.js';
import axios from 'axios';

const router = Router();

const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const META_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const META_API_URL = process.env.WHATSAPP_API_URL;
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const FONNTE_URL = process.env.FONNTE_URL;

async function sendWhatsAppMeta(to: string, message: string) {
  const response = await axios.post(
    `${META_API_URL}/${META_PHONE_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: message }
    },
    { headers: { 'Authorization': `Bearer ${META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function sendWhatsAppFonnte(to: string, message: string) {
  if (!FONNTE_TOKEN) return null;
  const response = await axios.post(`${FONNTE_URL}/send`, {
    target: to,
    message: message,
    countryCode: '62'
  }, { headers: { 'Authorization': FONNTE_TOKEN, 'Content-Type': 'application/json' } });
  return response.data;
}

async function sendWhatsApp(to: string, message: string) {
  try {
    return await sendWhatsAppMeta(to, message);
  } catch (error) {
    console.log('Meta failed, fallback to Fonnte');
    return await sendWhatsAppFonnte(to, message);
  }
}

// Send broadcast
router.post('/send', async (req, res) => {
  try {
    const { message, phoneNumbers } = req.body;
    
    let targets: string[] = phoneNumbers;
    if (!targets || targets.length === 0) {
      const customers = await prisma.customer.findMany({
        where: { phone: { not: null } },
        select: { phone: true }
      });
      targets = customers.map(c => c.phone!);
    }
    
    const broadcast = await prisma.wABroadcast.create({
      data: { message, targetCount: targets.length, sentCount: 0, status: 'PROCESSING', createdBy: 'admin' }
    });
    
    let sent = 0;
    for (const target of targets) {
      try {
        await sendWhatsApp(target, message);
        sent++;
        await prisma.wALog.create({ data: { phoneNumber: target, message, status: 'SENT', broadcastId: broadcast.id } });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        await prisma.wALog.create({ data: { phoneNumber: target, message, status: 'FAILED', broadcastId: broadcast.id } });
      }
    }
    
    const updated = await prisma.wABroadcast.update({
      where: { id: broadcast.id },
      data: { sentCount: sent, status: 'COMPLETED' }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Send single message
router.post('/send-single', async (req, res) => {
  try {
    const { target, message } = req.body;
    const result = await sendWhatsApp(target, message);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  const broadcasts = await prisma.wABroadcast.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(broadcasts);
});

router.get('/logs', async (req, res) => {
  const logs = await prisma.wALog.findMany({ orderBy: { sentAt: 'desc' }, take: 100 });
  res.json(logs);
});

export default router;