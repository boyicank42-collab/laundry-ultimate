// Printer Thermal for receipt

interface PrintReceiptData {
  invoiceCode: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

export async function printReceipt(data: PrintReceiptData) {
  const receipt = `
${"=".repeat(32)}
${"LAUNDRY ULTIMATE".padStart(24)}
${"=".repeat(32)}

${"INVOICE: " + data.invoiceCode}
${"TANGGAL: " + data.date}
${"PELANGGAN: " + data.customerName}
${"TELP: " + data.customerPhone}

${"-".repeat(32)}
${"ITEM".padEnd(20)}${"QTY".padEnd(6)}${"HARGA".padEnd(10)}
${"-".repeat(32)}

${data.items.map(item => 
  `${item.name.substring(0, 20).padEnd(20)}${item.qty.toString().padEnd(6)}${item.price.toLocaleString().padStart(10)}`
).join('\n')}

${"-".repeat(32)}
${"Subtotal".padEnd(26)}Rp ${data.subtotal.toLocaleString()}
${"Diskon".padEnd(26)}Rp ${data.discount.toLocaleString()}
${"PPN 11%".padEnd(26)}Rp ${data.tax.toLocaleString()}
${"TOTAL".padEnd(26)}Rp ${data.total.toLocaleString()}
${"-".repeat(32)}
${"PEMBAYARAN: " + data.paymentMethod}
${"STATUS: " + data.paymentStatus}
${"-".repeat(32)}

${"Terima kasih!".padStart(24)}
${"Laundry Ultimate".padStart(24)}
${"=".repeat(32)}
  `;
  
  // For Windows + Thermal Printer via USB
  try {
    // Method 1: Create text file and print
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
      iframe.contentWindow?.print();
      URL.revokeObjectURL(url);
      document.body.removeChild(iframe);
    }, 500);
    
    return true;
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
}

// Generate PDF receipt
export async function generatePDFReceipt(data: PrintReceiptData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('LAUNDRY ULTIMATE', 70, 20);
  doc.setFontSize(10);
  doc.text(`Invoice: ${data.invoiceCode}`, 20, 40);
  doc.text(`Tanggal: ${data.date}`, 20, 50);
  doc.text(`Pelanggan: ${data.customerName}`, 20, 60);
  doc.text(`Telp: ${data.customerPhone}`, 20, 70);
  
  let y = 90;
  data.items.forEach(item => {
    doc.text(`${item.name} x${item.qty} = Rp ${item.total.toLocaleString()}`, 20, y);
    y += 10;
  });
  
  y += 10;
  doc.text(`Subtotal: Rp ${data.subtotal.toLocaleString()}`, 20, y);
  doc.text(`Diskon: Rp ${data.discount.toLocaleString()}`, 20, y + 10);
  doc.text(`PPN: Rp ${data.tax.toLocaleString()}`, 20, y + 20);
  doc.text(`Total: Rp ${data.total.toLocaleString()}`, 20, y + 30);
  doc.text(`Pembayaran: ${data.paymentMethod} - ${data.paymentStatus}`, 20, y + 50);
  
  doc.save(`invoice_${data.invoiceCode}.pdf`);
  return true;
}