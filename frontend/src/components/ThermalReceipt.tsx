import React, { useRef } from 'react';
import { Printer } from 'lucide-react';

interface ReceiptData {
  invoiceCode: string;
  date: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  weight: number;
  pricePerUnit: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

const ThermalReceiptContent = ({ data }: { data: ReceiptData }) => {
  return (
    <div style={{ width: '227px', fontFamily: 'monospace', fontSize: '11px', padding: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>LAUNDRY ULTIMATE</div>
        <div style={{ fontSize: '9px' }}>PT SALSADILA MAHA KARYA</div>
        <div style={{ fontSize: '9px' }}>Jl. Merdeka No. 123, Jakarta</div>
        <div style={{ fontSize: '9px' }}>Telp: 0812-2177-2339</div>
        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
      </div>

      <div>Invoice: {data.invoiceCode}</div>
      <div>Tanggal: {data.date}</div>
      <div>Pelanggan: {data.customerName}</div>
      <div>Telp: {data.customerPhone}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

      <div>Layanan: {data.serviceType}</div>
      <div>Berat: {data.weight} kg</div>
      <div>Harga/kg: Rp {data.pricePerUnit?.toLocaleString()}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

      <div>Subtotal: Rp {data.subtotal?.toLocaleString()}</div>
      <div>Diskon: Rp {data.discount?.toLocaleString()}</div>
      <div style={{ fontWeight: 'bold' }}>Total: Rp {data.total?.toLocaleString()}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

      <div>Pembayaran: {data.paymentMethod}</div>
      <div>Status: {data.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}</div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <div>Terima kasih!</div>
        <div>Laundry Ultimate</div>
      </div>
    </div>
  );
};

const ThermalReceiptWrapper = ({ data }: { data: ReceiptData }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir. Izinkan popup untuk mencetak.');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk - ${data.invoiceCode}</title>
          <style>
            body { margin: 0; padding: 16px; display: flex; justify-content: center; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div id="print-content"></div>
          <script>
            const content = ${JSON.stringify(document.getElementById('receipt-content')?.outerHTML || '')};
            document.getElementById('print-content').innerHTML = content;
            window.print();
            window.close();
          <\/script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div id="receipt-content" ref={contentRef} style={{ display: 'none' }}>
        <ThermalReceiptContent data={data} />
      </div>
      <button
        onClick={() => {
          const content = contentRef.current?.innerHTML;
          if (content) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
              <html><head><title>Cetak Struk</title></head>
              <body>${content}<script>window.print();window.close();<\/script></body>
              </html>
            `);
            printWindow?.document.close();
          }
        }}
        className="flex-1 bg-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
      >
        <Printer className="h-4 w-4" /> Cetak Struk
      </button>
    </>
  );
};

export default ThermalReceiptWrapper;