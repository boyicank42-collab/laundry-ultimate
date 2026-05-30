import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Webhook untuk menerima pesan dari Fonnte (POST)
router.post('/webhook', async (req, res) => {
  try {
    // Baca raw body
    let rawBody = '';
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (req.body && typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body);
    }
    
    if (!rawBody || rawBody.length === 0) {
      return res.status(200).send('OK');
    }
    
    let data = {};
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      return res.status(200).send('OK');
    }
    
    // ============================================================
    // HANYA PROSES PESAN DARI CUSTOMER (BUKAN STATUS)
    // ============================================================
    
    // Cek apakah ini pesan customer (ada field 'message' atau 'text')
    const message = data.message || data.text || data.body || data.msg;
    const sender = data.sender || data.from || data.phone || data.number;
    const name = data.name || data.pushName || data.sender_name;
    
    // Jika tidak ada pesan atau pengirim, itu adalah status, bukan pesan customer
    if (!message || !sender) {
      console.log('📱 [CHATBOT] Status update - skip');
      return res.status(200).send('OK');
    }
    
    console.log(`📱 [CHATBOT] PESAN DARI CUSTOMER - Dari: ${sender}, Nama: ${name}, Pesan: ${message}`);
    
    // Auto reply berdasarkan pesan
    let reply = '';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('info') || lowerMessage.includes('harga')) {
      reply = `Halo ${name || 'Customer'}!\n\n📋 DAFTAR HARGA LAUNDRY:\n\n👕 Cuci Kering: Rp 8.000/kg\n👔 Cuci Setrika: Rp 12.000/kg\n⚡ Express: Rp 20.000/kg\n🛏️ Bedcover: Rp 50.000/pcs\n👟 Cuci Sepatu: Rp 35.000/pasang\n\nAda yang bisa dibantu?`;
    } 
    else if (lowerMessage.includes('alamat')) {
      reply = `📍 ALAMAT LAUNDRY ULTIMATE\n\nJl. Contoh No. 123, Kota Anda\n\n🕐 Jam buka: Senin-Sabtu 08.00-20.00, Minggu 09.00-17.00`;
    }
    else if (lowerMessage.includes('jam') || lowerMessage.includes('buka')) {
      reply = `🕐 JAM OPERASIONAL\n\nSenin - Sabtu: 08.00 - 20.00\nMinggu: 09.00 - 17.00`;
    }
    else {
      reply = `Halo ${name || 'Customer'}! 👋\n\nSelamat datang di LAUNDRY ULTIMATE.\n\nKetik INFO untuk lihat harga\nKetik ALAMAT untuk lihat lokasi\nKetik JAM untuk lihat jam operasional`;
    }
    
    // Kirim balasan via Fonnte API
    const token = process.env.FONNTE_TOKEN || '';
    
    if (!token) {
      console.log('❌ Token Fonnte tidak ditemukan');
      return res.status(200).send('OK');
    }
    
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: sender,
        message: reply
      })
    });
    
    const result = await response.json();
    console.log('📱 [CHATBOT] Balasan terkirim:', result);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [CHATBOT] Error:', error.message);
    res.status(200).send('OK');
  }
});

// Endpoint GET untuk verifikasi webhook
router.get('/webhook', (req, res) => {
  console.log('📱 [CHATBOT] GET webhook - verification');
  res.status(200).send('OK');
});

export default router;