import { Router } from 'express';
import { prisma } from '../index.js';
import axios from 'axios';

const router = Router();

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const FONNTE_URL = process.env.FONNTE_URL || 'https://api.fonnte.com';

// Nomor device sendiri (JANGAN DI BALAS)
const DEVICE_NUMBER = '6281221723399';

// Set untuk menyimpan pesan yang sudah diproses (cegah duplikat)
const processedMessages = new Set();

async function sendWhatsApp(to: string, message: string) {
  if (!FONNTE_TOKEN) return null;
  
  let cleanNumber = to;
  if (cleanNumber.startsWith('62')) cleanNumber = '0' + cleanNumber.slice(2);
  if (cleanNumber.startsWith('+62')) cleanNumber = '0' + cleanNumber.slice(3);
  if (!cleanNumber.startsWith('08')) cleanNumber = '08' + cleanNumber.slice(-10);
  
  try {
    const response = await axios.post(`${FONNTE_URL}/send`, {
      target: cleanNumber,
      message: message,
      countryCode: '62'
    }, {
      headers: { 'Authorization': FONNTE_TOKEN, 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Fonnte error:', error);
    return null;
  }
}

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    console.log('Webhook received:', JSON.stringify(body).substring(0, 200));
    
    // Ambil pengirim
    let sender = body.sender || body.pengirim || '';
    let message = body.message || body.pesan || '';
    let messageId = body.id || body.inboxid || '';
    
    // HAPUS TANDA > _Sent via fonnte.com_ (pesan dari bot sendiri)
    if (message.includes('_Sent via fonnte.com_') || message.includes('Sent via fonnte')) {
      console.log('❌ Ignoring bot signature message');
      return res.sendStatus(200);
    }
    
    // CEK APAKAH PESAN DARI NOMOR DEVICE SENDIRI
    if (sender === DEVICE_NUMBER || sender === '081221723399' || sender === '6281221723399') {
      console.log('❌ Ignoring message from own device');
      return res.sendStatus(200);
    }
    
    // CEK APAKAH PESAN SUDAH DIPROSES (CEGAH DUPLIKAT)
    const messageKey = `${sender}_${message.substring(0, 50)}`;
    if (processedMessages.has(messageKey)) {
      console.log('❌ Duplicate message ignored');
      return res.sendStatus(200);
    }
    processedMessages.add(messageKey);
    setTimeout(() => processedMessages.delete(messageKey), 60000);
    
    if (!message) {
      return res.sendStatus(200);
    }
    
    console.log(`✅ NEW MESSAGE from CUSTOMER ${sender}: ${message.substring(0, 50)}`);
    
    // Proses intent
    let reply = '';
    const lowerMsg = message.toLowerCase();
    
    // CEK INVOICE (DETAIL RESPONSE)
    const invoiceMatch = message.match(/INV\/[A-Z0-9\/]+/i);
    if (invoiceMatch) {
      const invoice = invoiceMatch[0];
      const transaction = await prisma.transaction.findUnique({
        where: { invoiceCode: invoice },
        include: { customer: true, user: true }
      });
      
      if (transaction) {
        const statusMap: Record<string, string> = {
          PENDING: '⏳ PENDING - Menunggu diproses',
          PROGRESS: '🔄 PROSES - Laundry sedang dicuci',
          READY: '✅ SIAP - Laundry siap diambil',
          COMPLETED: '🎉 SELESAI - Laundry sudah selesai',
          CANCELLED: '❌ BATAL - Transaksi dibatalkan'
        };
        
        const paymentMap: Record<string, string> = {
          UNPAID: '❌ BELUM BAYAR',
          PAID: '✅ LUNAS',
          PARTIAL: '⚠️ DP (Down Payment)'
        };
        
        reply = `🏷️ *INVOICE LAUNDRY ULTIMATE*
━━━━━━━━━━━━━━━━━━━━━

📄 *No. Invoice:* ${transaction.invoiceCode}
📅 *Tanggal:* ${new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
🕐 *Waktu:* ${new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}

👤 *Pelanggan:* ${transaction.customer.name}
📞 *No. HP:* ${transaction.customer.phone || '-'}

━━━━━━━━━━━━━━━━━━━━━
*DETAIL LAYANAN*
━━━━━━━━━━━━━━━━━━━━━

📌 *Layanan:* ${transaction.serviceType}
⚖️ *Berat:* ${transaction.weight || '-'} kg
💰 *Harga/kg:* Rp ${(transaction.pricePerUnit || 0).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
*RINCIAN BIAYA*
━━━━━━━━━━━━━━━━━━━━━

💵 *Subtotal:* Rp ${(transaction.subtotal || 0).toLocaleString()}
🏷️ *Diskon:* Rp ${(transaction.discount || 0).toLocaleString()}
📊 *PPN 11%:* Rp ${(transaction.tax || 0).toLocaleString()}
💎 *TOTAL:* *Rp ${(transaction.total || 0).toLocaleString()}*

━━━━━━━━━━━━━━━━━━━━━
*STATUS*
━━━━━━━━━━━━━━━━━━━━━

📌 *Status Laundry:* ${statusMap[transaction.status] || transaction.status}
💳 *Status Bayar:* ${paymentMap[transaction.paymentStatus] || transaction.paymentStatus}

━━━━━━━━━━━━━━━━━━━━━
📞 *CS: 0812-2177-2339*
Terima kasih telah menggunakan Laundry Ultimate! 🙏`;
      } else {
        reply = `❌ *Invoice Tidak Ditemukan*

Maaf, invoice dengan kode *${invoice}* tidak ditemukan.

💡 Pastikan format invoice benar:
Contoh: INV/202605/XXXXXX

Atau hubungi CS kami di 0812-2177-2339 untuk bantuan lebih lanjut.`;
      }
    } 
    else if (lowerMsg.includes('menu') || lowerMsg.includes('layanan')) {
      reply = `🍽️ *MENU LAYANAN LAUNDRY ULTIMATE*
━━━━━━━━━━━━━━━━━━━━━

1️⃣ *Cuci Kering*
   Rp 8.000/kg

2️⃣ *Cuci Setrika*
   Rp 12.000/kg

3️⃣ *Express (1 Hari)*
   Rp 20.000/kg

4️⃣ *Bedcover*
   Rp 50.000/pcs

5️⃣ *Cuci Sepatu*
   Rp 35.000/pasang

━━━━━━━━━━━━━━━━━━━━━
📌 Kirim *INVOICE/INV/...* untuk cek status laundry.
📞 CS: 0812-2177-2339`;
    } 
    else if (lowerMsg.includes('harga') || lowerMsg.includes('price')) {
      reply = `💰 *HARGA LAYANAN*
━━━━━━━━━━━━━━━━━━━━━

📌 Cuci Kering: Rp 8.000/kg
📌 Cuci Setrika: Rp 12.000/kg
📌 Express: Rp 20.000/kg
📌 Bedcover: Rp 50.000/pcs
📌 Cuci Sepatu: Rp 35.000/pasang

*Promo spesial bulan ini!*
Hubungi outlet terdekat.`;
    } 
    else if (lowerMsg.includes('promo') || lowerMsg.includes('diskon')) {
      reply = `🎉 *PROMO SPESIAL LAUNDRY ULTIMATE!* 🎉
━━━━━━━━━━━━━━━━━━━━━

✨ *Cuci 5kg GRATIS 1kg*
✨ *Diskon 10% untuk pelanggan baru*
✨ *Gratis antar jemput minimal 10kg*

Periode terbatas! Dapatkan sekarang.

📞 Hubungi: 0812-2177-2339`;
    } 
    else if (lowerMsg.includes('daftar') || lowerMsg.includes('register')) {
      let customer = await prisma.customer.findUnique({ 
        where: { phone: sender } 
      });
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: { 
            name: `Pelanggan ${sender.slice(-4)}`, 
            phone: sender, 
            totalSpent: 0, 
            totalOrders: 0 
          }
        });
        reply = `✅ *Selamat! Registrasi Berhasil*
━━━━━━━━━━━━━━━━━━━━━

Anda telah terdaftar sebagai pelanggan *Laundry Ultimate*.

📋 *ID Pelanggan:* ${customer.id.slice(-8)}
📞 *No. HP:* ${sender}

Kirim *MENU* untuk melihat layanan kami.

Terima kasih telah bergabung! 🙏`;
      } else {
        reply = `✅ *Anda Sudah Terdaftar!*

👤 *Nama:* ${customer.name}
📞 *No. HP:* ${customer.phone || sender}
📊 *Total Order:* ${customer.totalOrders || 0} kali
💰 *Total Belanja:* Rp ${(customer.totalSpent || 0).toLocaleString()}

Kirim *MENU* untuk lihat layanan.`;
      }
    } 
    else if (lowerMsg.includes('bantuan') || lowerMsg.includes('help')) {
      reply = `🆘 *BANTUAN LAUNDRY ULTIMATE*
━━━━━━━━━━━━━━━━━━━━━

📌 *Perintah yang tersedia:*

• *MENU* - Lihat layanan
• *HARGA* - Info harga
• *PROMO* - Info promo spesial
• *DAFTAR* - Registrasi pelanggan
• *INVOICE/INV/...* - Cek status laundry

━━━━━━━━━━━━━━━━━━━━━
📞 *CS:* 0812-2177-2339
🏠 *Alamat:* Jl. Merdeka No. 123, Jakarta Pusat`;
    } 
    else {
      const config = await prisma.chatbotConfig.findFirst();
      reply = config?.welcomeMsg || `Halo! Selamat datang di *Laundry Ultimate*.

━━━━━━━━━━━━━━━━━━━━━
📌 *Perintah yang tersedia:*

• *MENU* - Lihat layanan
• *HARGA* - Info harga
• *PROMO* - Info promo
• *DAFTAR* - Registrasi pelanggan
• *INVOICE/INV/...* - Cek status laundry

Butuh bantuan? Ketik *BANTUAN*.`;
    }
    
    // Simpan log
    await prisma.chatbotLog.create({
      data: {
        phoneNumber: sender,
        message: message.substring(0, 500),
        reply: reply.substring(0, 500),
        intent: 'reply'
      }
    });
    
    // Kirim balasan SEKALI SAJA
    console.log(`📤 Sending reply to ${sender}...`);
    await sendWhatsApp(sender, reply);
    console.log(`✅ Reply sent to ${sender}`);
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await sendWhatsApp(to, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/config', async (req, res) => {
  try {
    let config = await prisma.chatbotConfig.findFirst();
    if (!config) {
      config = await prisma.chatbotConfig.create({
        data: { enabled: true, welcomeMsg: "Halo! Selamat datang di Laundry Ultimate.", outletId: "1" }
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const { enabled, welcomeMsg } = req.body;
    let config = await prisma.chatbotConfig.findFirst();
    if (config) {
      config = await prisma.chatbotConfig.update({
        where: { id: config.id },
        data: { enabled, welcomeMsg }
      });
    } else {
      config = await prisma.chatbotConfig.create({
        data: { enabled, welcomeMsg, outletId: "1" }
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.chatbotLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;