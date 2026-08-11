import { useState } from 'react'
import { Printer } from 'lucide-react'

export default function InvoicePrinter() {
  const invoices = [
    {
      id: '1',
      title: 'Invoice Tagihan Pengambilan 3kg ke Pabrik Boyolali',
      date: '2026-08-06',
      total: 345000,
      recipient: 'Pabrik Bawang Merah Boyolali',
      type: 'Tagihan Pabrik',
      details: [
        { name: 'Grade S Murni (2,0 kg)', qty: '2 kg', price: 120000, subtotal: 240000 },
        { name: 'Grade A Crispy (1,0 kg)', qty: '1 kg', price: 105000, subtotal: 105000 }
      ]
    },
    {
      id: '2',
      title: 'Invoice Operasional & Stiker Kemasan Didi',
      date: '2026-08-07',
      total: 147000,
      recipient: 'Sdr. Didi (Tim Operasional)',
      type: 'Operasional Tim',
      details: [
        { name: 'Pengadaan Stiker Kemasan Pouch (Klaim Didi)', qty: '1 Paket', price: 127000, subtotal: 127000 },
        { name: 'Pengeluaran Kas Operasional Didi (Klaim Reimburse)', qty: '1 Kas', price: 20000, subtotal: 20000 }
      ]
    },
    {
      id: '3',
      title: 'Faktur Pembelian Kemasan Pouch Sdr. Fahru',
      date: '2026-08-07',
      total: 35675,
      recipient: 'Sdr. Fahru (Kemasan)',
      type: 'Pembelian Kemasan',
      details: [
        { name: 'Kemasan Pouch Standar Aluminium', qty: '1 Paket', price: 35675, subtotal: 35675 }
      ]
    }
  ]

  const [selectedInvoice, setSelectedInvoice] = useState(invoices[0])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark p-6 rounded-2xl text-white shadow-lg border border-brand-gold/30 print:hidden">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Dokumen Resmi & Nota</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">Invoice & Printer Nota Juragan Bawang</h2>
          <p className="text-xs text-brand-cream/80 mt-1">Cetak nota transaksi pelanggan, invoice pengambilan pabrik 3kg, dan nota operasional</p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Invoice / PDF</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 print:block">
        {/* Invoice Selector List */}
        <div className="space-y-3 print:hidden">
          <h3 className="font-bold text-xs uppercase text-brand-charcoal/70 tracking-wider">Pilih Templat Invoice</h3>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedInvoice.id === inv.id ? 'bg-white border-2 border-brand-gold shadow-md' : 'bg-white/60 border-brand-gold/20 hover:bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-brand-maroon px-2 py-0.5 bg-brand-cream rounded-md">
                  {inv.type}
                </span>
                <span className="text-[11px] font-mono text-brand-charcoal/60">{inv.date}</span>
              </div>
              <h4 className="font-bold text-xs text-brand-charcoal mt-2">{inv.title}</h4>
              <p className="text-sm font-extrabold text-brand-maroon mt-1">Rp {inv.total.toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>

        {/* Printable Invoice Sheet */}
        <div className="md:col-span-2 bg-white p-8 rounded-2xl border-2 border-brand-gold/40 shadow-lg print:border-none print:shadow-none print:p-0">
          <div className="border-b-2 border-brand-maroon pb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-extrabold text-brand-maroon tracking-wider">JURAGAN BY ANAK BAWANG</h1>
              <p className="text-xs text-brand-charcoal/70 font-medium mt-1">Bawang Goreng Asli Boyolali 100% Murni Kualitas Premium</p>
              <p className="text-[11px] text-brand-charcoal/60">Jl. Raya Boyolali - Solo | WA: 0821-3385-9391</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-brand-maroon px-3 py-1 bg-brand-cream border border-brand-gold/40 rounded-lg">
                OFFICIAL INVOICE
              </span>
              <p className="text-xs font-mono text-brand-charcoal/70 mt-2">Tanggal: {selectedInvoice.date}</p>
            </div>
          </div>

          <div className="my-6 bg-brand-cream/30 p-4 rounded-xl border border-brand-gold/20 flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] uppercase text-brand-charcoal/60 font-bold block">Penerima / Tagihan Untuk:</span>
              <span className="font-bold text-sm text-brand-maroon">{selectedInvoice.recipient}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-brand-charcoal/60 font-bold block">Jenis Transaksi:</span>
              <span className="font-semibold text-brand-charcoal">{selectedInvoice.type}</span>
            </div>
          </div>

          {/* Details Table */}
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-brand-charcoal/20 text-brand-charcoal uppercase text-[10px] tracking-wider font-bold">
                <th className="py-2">Item Rincian</th>
                <th className="py-2">Jumlah</th>
                <th className="py-2">Harga Satuan</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-maroon/10">
              {selectedInvoice.details.map((d, i) => (
                <tr key={i}>
                  <td className="py-3 font-semibold text-brand-charcoal">{d.name}</td>
                  <td className="py-3 font-medium">{d.qty}</td>
                  <td className="py-3 font-mono">Rp {d.price.toLocaleString('id-ID')}</td>
                  <td className="py-3 font-bold text-right font-mono">Rp {d.subtotal.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Footer */}
          <div className="border-t-2 border-brand-maroon pt-4 flex justify-between items-center">
            <div className="text-xs text-brand-charcoal/60">
              <p className="font-semibold">Catatan:</p>
              <p>Dokumen komersial sah diterbitkan oleh manajemen Juragan by Anak Bawang.</p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase text-brand-charcoal/70 font-bold block">Total Tagihan:</span>
              <span className="text-2xl font-extrabold text-brand-maroon font-mono">Rp {selectedInvoice.total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
