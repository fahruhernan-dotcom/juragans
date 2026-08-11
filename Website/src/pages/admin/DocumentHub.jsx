import { useState, useMemo, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import {
  FileText, Search, ShieldCheck, CheckCircle2,
  Copy, Layers, ChevronRight, X, Clock
} from 'lucide-react'

// Master Database Dokumen Terintegrasi
const DOCUMENTS_REGISTRY = [
  // 📜 LEGAL & SPK TIM
  {
    docNumber: 'SPK/JAB/2026/08/001',
    title: 'Surat Perjanjian Kerja Sdr. Reyhan',
    category: 'legal',
    categoryLabel: 'Legal & SPK Tim',
    party: 'Sdr. Reyhan (Marketing & Sales Specialist)',
    date: '2026-08-08',
    status: 'Kontrak Aktif',
    statusType: 'success',
    path: 'Dokumen_Legal/Surat_Perjanjian_Kerja_Reyhan.md',
    details: 'SPK Resmi Pemasaran Ritel (Jabodetabek & Semarang), B2B Outreach, Proteksi Suplier/HPP, Aset IP, Denda Rp 50 Juta, & Non-Compete Clause 5 Tahun.',
    tags: ['SPK', 'Reyhan', 'Marketing', 'Non-Compete', 'NDA']
  },
  {
    docNumber: 'SPK/JAB/2026/08/002',
    title: 'Surat Perjanjian Kerja Sdr. Didi',
    category: 'legal',
    categoryLabel: 'Legal & SPK Tim',
    party: 'Sdr. Didi (E-Commerce & Repackaging Specialist)',
    date: '2026-08-08',
    status: 'Kontrak Aktif',
    statusType: 'success',
    path: 'Dokumen_Legal/Surat_Perjanjian_Kerja_Didi.md',
    details: 'SPK Resmi Repackaging, Penimbangan Presisi, Stiker Sampurna, Penyerahan Nota/Kas Offline, Proteksi HPP, Aset IP, Denda Rp 50 Juta, & Non-Compete Clause 5 Tahun.',
    tags: ['SPK', 'Didi', 'Repackaging', 'E-Commerce', 'Non-Compete']
  },
  {
    docNumber: 'JOB/OWNER/2026/08/001',
    title: 'Jobdesk & Portofolio Operasional Owner (Founder)',
    category: 'legal',
    categoryLabel: 'Legal & SPK Tim',
    party: 'Owner / Founder (CEO & Lead System Architect)',
    date: '2026-08-08',
    status: 'Dokumen Master Owner',
    statusType: 'purple',
    path: 'Dokumen_Legal/Jobdesk_dan_Portofolio_Owner.md',
    details: 'Masterwork Portofolio 7 Sektor: Permodalan Awal, QRIS Resmi, Supabase Cloud, React Admin Dashboard, Bot Python IG/TikTok, Generator PDF, & Sistem Legalitas Usaha.',
    tags: ['Owner', 'Founder', 'CEO', 'Master', 'Portofolio']
  },
  {
    docNumber: 'HALAL-ID33110018517710724',
    title: 'Sertifikat Halal Resmi Ernawati',
    category: 'legal',
    categoryLabel: 'Legal & SPK Tim',
    party: 'BPJPH Kementerian Agama RI',
    date: '2024-07-24',
    status: 'Resmi Terbit (Kemenag)',
    statusType: 'success',
    path: 'Dokumen_Legal/Sertifikat Halal Ernawati.pdf',
    details: 'Sertifikasi Halal Resmi Produk Bawang Goreng Boyolali ID33110018517710724.',
    tags: ['Halal', 'Kemenag', 'BPJPH', 'Sertifikat', 'Legalitas']
  },
  {
    docNumber: 'NIB-OSS-202607-001',
    title: 'Nomor Induk Berusaha (NIB Usaha)',
    category: 'legal',
    categoryLabel: 'Legal & SPK Tim',
    party: 'Kementerian Investasi / BKPM OSS RI',
    date: '2026-07-15',
    status: 'Resmi Terbit (OSS)',
    statusType: 'success',
    path: 'Dokumen_Legal/NIB TERBIT ANAK BAWANG.pdf',
    details: 'Izin Usaha Operasional & Komersial Resmi Anak Bawang Boyolali.',
    tags: ['NIB', 'OSS', 'BKPM', 'Perizinan', 'Izin Usaha']
  },

  // 🧾 INVOICE PELANGGAN
  {
    docNumber: 'INV/2026/08/001',
    title: 'Invoice Tagihan Pelanggan — Adip Semarang',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Adip (Kost Bulusan, Tembalang, Semarang)',
    date: '2026-08-05',
    status: 'Lunas',
    statusType: 'success',
    amount: 43500,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_adip_agustus_2026.pdf',
    details: '1 Pack Grade S Murni 250g @ Rp 43.500 (Terbayar Lunas - Terkirim).',
    tags: ['Invoice', 'Adip', 'Semarang', 'Grade S', 'Lunas']
  },
  {
    docNumber: 'INV/2026/08/002',
    title: 'Invoice Tagihan Pelanggan — Renny',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Renny (Jakarta/Semarang)',
    date: '2026-08-07',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 75000,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_renny_agustus_2026.pdf',
    details: '2 Pack Grade S Murni 200g @ Rp 37.500 = Rp 75.000.',
    tags: ['Invoice', 'Renny', 'Grade S', 'Belum Lunas']
  },
  {
    docNumber: 'INV/2026/08/003',
    title: 'Invoice Tagihan Pelanggan — Anggi',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Anggi (Mitra Pemasaran Bulk)',
    date: '2026-08-07',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 165500,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_anggi_agustus_2026.pdf',
    details: 'Paket Bulk 1kg (5 pack 200g Grade S Murni @ Rp 33.100 = Rp 165.500).',
    tags: ['Invoice', 'Anggi', 'Bulk 1kg', 'Belum Lunas']
  },
  {
    docNumber: 'INV/2026/08/004',
    title: 'Invoice Tagihan Pelanggan — Hendry',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Hendry',
    date: '2026-08-07',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 150000,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_hendry_agustus_2026.pdf',
    details: '4 Pack Grade S Murni 200g @ Rp 37.500 = Rp 150.000.',
    tags: ['Invoice', 'Hendry', 'Grade S', 'Belum Lunas']
  },
  {
    docNumber: 'INV/2026/08/005',
    title: 'Invoice Tagihan Pelanggan — Amal',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Amal',
    date: '2026-08-07',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 87000,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_amal_agustus_2026.pdf',
    details: '2 Pack Grade S Murni 250g @ Rp 43.500 = Rp 87.000.',
    tags: ['Invoice', 'Amal', 'Grade S', 'Belum Lunas']
  },
  {
    docNumber: 'INV/2026/08/006',
    title: 'Invoice Tagihan Pelanggan — Widi',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Widi',
    date: '2026-08-07',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 106000,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_widi_agustus_2026.pdf',
    details: '4 Pack Grade S Murni 150g @ Rp 26.500 = Rp 106.000.',
    tags: ['Invoice', 'Widi', 'Grade S', 'Belum Lunas']
  },
  {
    docNumber: 'INV/2026/08/007',
    title: 'Invoice Tagihan Pelanggan — Bukit',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Bukit',
    date: '2026-08-07',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 87000,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_bukit_agustus_2026.pdf',
    details: '2 Pack Grade S Murni 250g @ Rp 43.500 = Rp 87.000.',
    tags: ['Invoice', 'Bukit', 'Grade S', 'Belum Lunas']
  },
  {
    docNumber: 'INV/2026/08/008',
    title: 'Invoice Tagihan Pelanggan — Didi (Bal PE)',
    category: 'invoice_customer',
    categoryLabel: 'Invoice Pelanggan',
    party: 'Sdr. Didi (Distribus Bal PE)',
    date: '2026-08-08',
    status: 'Belum Lunas',
    statusType: 'warning',
    amount: 271000,
    path: 'Manajemen_Pesanan/invoices_pelanggan/invoice_didi_agustus_2026.pdf',
    details: '2 Pack Grade A Bal PE 1kg @ Rp 135.500 = Rp 271.000.',
    tags: ['Invoice', 'Didi', 'Grade A', 'Bal PE']
  },

  // 🏭 INVOICE PABRIK & OPERASIONAL
  {
    docNumber: 'INV/PABRIK/2026/08/001',
    title: 'Invoice Tagihan Pabrik Boyolali — Batch 1 (3 kg)',
    category: 'invoice_pabrik',
    categoryLabel: 'Invoice Pabrik & Ops',
    party: 'Pabrik Bawang Merah Boyolali (Cepogo)',
    date: '2026-08-01',
    status: 'Lunas Terbayar',
    statusType: 'success',
    amount: 345000,
    path: 'Manajemen_Pesanan/invoice_tagihan_pabrik_3kg.pdf',
    details: 'Pengambilan 2 kg Grade S (Rp 240k) + 1 kg Grade A (Rp 105k) = Rp 345.000 (Terbayar Lunas ✅).',
    tags: ['Pabrik', 'Boyolali', 'Batch 1', 'Lunas']
  },
  {
    docNumber: 'INV/PABRIK/2026/08/002',
    title: 'Invoice Tagihan Pabrik Boyolali — Batch 2 (7 kg)',
    category: 'invoice_pabrik',
    categoryLabel: 'Invoice Pabrik & Ops',
    party: 'Pabrik Bawang Merah Boyolali (Cepogo)',
    date: '2026-08-09',
    status: 'Pending Pabrik',
    statusType: 'info',
    amount: 735000,
    path: 'Manajemen_Pesanan/invoice_tagihan_pabrik_batch2_7kg.pdf',
    details: 'Pengambilan Batch 2 sebanyak 7 kg (4 kg Grade S Murni @ Rp 105k + 3 kg Grade A Crispy TBD @ Rp 105k) = Rp 735.000.',
    tags: ['Pabrik', 'Boyolali', 'Batch 2', '7 kg', 'Pending']
  },
  {
    docNumber: 'INV/OPS-DIDI/2026/08/001',
    title: 'Nota Operasional Didi — Stiker Sampurna & JNE',
    category: 'invoice_pabrik',
    categoryLabel: 'Invoice Pabrik & Ops',
    party: 'Sampurna Printshop & JNE (Reimburse Didi)',
    date: '2026-08-02',
    status: 'Lunas Reimburse',
    statusType: 'success',
    amount: 147500,
    path: 'Manajemen_Pesanan/invoice_operasional_didi_stiker.pdf',
    details: 'Cetak Stiker Sampurna Printshop No. 05498 (Rp 127.500) + Ongkir JNE (Rp 20.000) = Rp 147.500.',
    tags: ['Operasional', 'Stiker', 'Sampurna', 'JNE', 'Reimburse']
  },
  {
    docNumber: 'INV/KMS-FAHRU/2026/08/001',
    title: 'Faktur Pembelian Kemasan Pouch — Sdr. Fahru',
    category: 'invoice_pabrik',
    categoryLabel: 'Invoice Pabrik & Ops',
    party: 'Supplier Kemasan Pouch Sdr. Fahru',
    date: '2026-08-03',
    status: 'Lunas Owner',
    statusType: 'success',
    amount: 35675,
    path: 'Manajemen_Pesanan/invoice_pembelian_kemasan_fahru.pdf',
    details: 'Pembelian paket kantong standing pouch kemasan bawang = Rp 35.675.',
    tags: ['Kemasan', 'Pouch', 'Fahru', 'Procurement', 'Owner']
  },

  // 🏷️ MASTER PRICING & STRATEGI
  {
    docNumber: 'SKU-MASTER-2026',
    title: 'Master Database SKU, HPP, & Pricing Center',
    category: 'pricing',
    categoryLabel: 'Master Pricing & Strategi',
    party: 'Juragan by Anak Bawang (Owner Center)',
    date: '2026-08-08',
    status: 'Single Source of Truth',
    statusType: 'purple',
    path: 'master_pricelist_sku.csv',
    details: 'Acuan HPP presisi Bawang, Pouch, Stiker Depan/Belakang, Opsi Harga Solo Raya, Jakarta/Semarang, Promo, Coret, & Grosir.',
    tags: ['Master SKU', 'HPP', 'Pricelist', 'Margin', 'CSV']
  },
  {
    docNumber: 'STRATEGI-PRICING-01',
    title: 'Master Strategi Penetapan Harga & Bisnis',
    category: 'pricing',
    categoryLabel: 'Master Pricing & Strategi',
    party: 'Juragan by Anak Bawang',
    date: '2026-08-01',
    status: 'Dokumen Strategi',
    statusType: 'purple',
    path: 'Strategi Bisnis/01_Penetapan_Harga_dan_SKU/master_strategi_penetapan_harga_dan_bisnis.md',
    details: 'Dokumentasi komprehensif formula penentuan margin target, tiered pricing, dan analisis kelayakan bisnis.',
    tags: ['Strategi', 'Harga', 'Bisnis', 'Margin', 'Plan']
  },

  // 📝 NOTULENSI & REKAP
  {
    docNumber: 'NOTUL/2026/08/M1',
    title: 'Laporan Perkembangan Mingguan — Minggu 1 Agustus 2026',
    category: 'notulensi',
    categoryLabel: 'Notulensi & Rekap',
    party: 'Tim Juragan by Anak Bawang',
    date: '2026-08-07',
    status: 'Arsip Rekap M1',
    statusType: 'info',
    path: 'Notulensi/2026/08_Agustus/minggu_1.md',
    details: 'Laporan audit stok Reyhan & Didi, rekap 20 pack pesanan deal (Omset 712k, Profit 151k), & pengeluaran awal.',
    tags: ['Notulensi', 'Agustus', 'Minggu 1', 'Audit Stok', 'Profit']
  },
  {
    docNumber: 'NOTUL/2026/08/BULANAN',
    title: 'Laporan Perkembangan Bulanan — Agustus 2026',
    category: 'notulensi',
    categoryLabel: 'Notulensi & Rekap',
    party: 'Tim Juragan by Anak Bawang',
    date: '2026-08-08',
    status: 'Arsip Bulanan',
    statusType: 'info',
    path: 'Notulensi/2026/08_Agustus/notul_bulanan.md',
    details: 'Ringkasan eksekutif perkembangan Agustus, audit stok 3kg pabrik, rekap bakar duit Rp 528k, & perincian peran tim.',
    tags: ['Notulensi', 'Agustus', 'Bulanan', 'Eksekutif', 'Supabase']
  },
  {
    docNumber: 'NOTUL/2026/07/BULANAN',
    title: 'Laporan Perkembangan Bulanan — Juli 2026',
    category: 'notulensi',
    categoryLabel: 'Notulensi & Rekap',
    party: 'Tim Juragan by Anak Bawang',
    date: '2026-07-26',
    status: 'Arsip Bulanan',
    statusType: 'info',
    path: 'Notulensi/2026/07_Juli/notul_bulanan.md',
    details: 'Validasi pasar Jabodetabek (keunggulan bawang utuh murni), filtering 27 resto bakso B2B Solo, & launching website.',
    tags: ['Notulensi', 'Juli', 'Bulanan', 'Validasi Pasar', 'B2B']
  }
]

const CATEGORIES = [
  { id: 'all',              label: 'Semua Dokumen',          count: DOCUMENTS_REGISTRY.length },
  { id: 'legal',            label: '📜 Legal & SPK Tim',      count: DOCUMENTS_REGISTRY.filter(d => d.category === 'legal').length },
  { id: 'invoice_customer', label: '🧾 Invoice Pelanggan',     count: DOCUMENTS_REGISTRY.filter(d => d.category === 'invoice_customer').length },
  { id: 'invoice_pabrik',   label: '🏭 Invoice Pabrik & Ops',  count: DOCUMENTS_REGISTRY.filter(d => d.category === 'invoice_pabrik').length },
  { id: 'pricing',          label: '🏷️ Master Pricing SKU',   count: DOCUMENTS_REGISTRY.filter(d => d.category === 'pricing').length },
  { id: 'notulensi',        label: '📝 Notulensi Rapat',       count: DOCUMENTS_REGISTRY.filter(d => d.category === 'notulensi').length }
]

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

export default function DocumentHub() {
  const [documentsList, setDocumentsList] = useState(DOCUMENTS_REGISTRY)
  const [searchTerm, setSearchTerm]     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeModalDoc, setActiveModalDoc]   = useState(null)
  const [copiedDocNum, setCopiedDocNum]       = useState('')

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('juragan_documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setDocumentsList(data.map(d => ({
          docNumber: d.doc_number,
          title: d.title,
          category: d.category,
          categoryLabel: d.category_label,
          party: d.party,
          date: d.doc_date,
          status: d.status,
          statusType: d.status_type,
          amount: d.amount,
          path: d.file_path,
          details: d.details,
          tags: d.tags || []
        })))
      }
    } catch (e) {
      console.warn('Fallback to local documents registry:', e)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSupabaseConfigured()) {
        fetchDocuments()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Filter logic
  const filteredDocs = useMemo(() => {
    return documentsList.filter((doc) => {
      const matchCat = selectedCategory === 'all' || doc.category === selectedCategory
      const searchLower = searchTerm.toLowerCase().trim()
      if (!searchLower) return matchCat

      const matchSearch =
        doc.docNumber.toLowerCase().includes(searchLower) ||
        doc.title.toLowerCase().includes(searchLower) ||
        doc.party.toLowerCase().includes(searchLower) ||
        doc.details.toLowerCase().includes(searchLower) ||
        doc.tags.some(t => t.toLowerCase().includes(searchLower))

      return matchCat && matchSearch
    })
  }, [documentsList, searchTerm, selectedCategory])

  const handleCopyNo = (docNum) => {
    navigator.clipboard.writeText(docNum)
    setCopiedDocNum(docNum)
    setTimeout(() => setCopiedDocNum(''), 2000)
  }

  // Stat Counter
  const totalLegal = DOCUMENTS_REGISTRY.filter(d => d.category === 'legal').length
  const totalInvoices = DOCUMENTS_REGISTRY.filter(d => d.category.startsWith('invoice')).length
  const unpaidInvoices = DOCUMENTS_REGISTRY.filter(d => d.status === 'Belum Lunas').length

  return (
    <div className="space-y-6 text-left">
      {/* ── Stat Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-maroon/10 text-brand-maroon flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Registri</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{DOCUMENTS_REGISTRY.length} Dokumen</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Tersusun Rapi & Terindeks</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Legalitas & SPK</p>
            <p className="text-xl font-black text-purple-900 mt-0.5">{totalLegal} Berkas</p>
            <p className="text-[10px] text-purple-600 font-bold mt-0.5">Non-Compete 5Th Active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Invoicing Total</p>
            <p className="text-xl font-black text-blue-900 mt-0.5">{totalInvoices} Invoices</p>
            <p className="text-[10px] text-blue-600 font-bold mt-0.5">Pelanggan & Pabrik</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Invoice Pending</p>
            <p className="text-xl font-black text-amber-900 mt-0.5">{unpaidInvoices} Tagihan</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Menunggu Pembayaran</p>
          </div>
        </div>
      </div>

      {/* ── Search Bar & Filter Tabs ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Live Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No. Dokumen (SPK/JAB, INV/2026), Nama Klien..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-900">{filteredDocs.length}</span> dari {DOCUMENTS_REGISTRY.length} dokumen
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-brand-maroon text-white shadow-md shadow-brand-maroon/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* ── Document Table / Cards List ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Tidak ada dokumen yang cocok dengan pencarian "{searchTerm}"</p>
            <p className="text-xs text-gray-400 mt-1">Coba gunakan nomor dokumen lain atau bersihkan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">No. Dokumen & Judul</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Pihak Terkait</th>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.docNumber} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0 group-hover:bg-brand-gold/20 group-hover:text-brand-maroon transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-maroon bg-brand-maroon/5 px-2 py-0.5 rounded text-[11px]">
                              {doc.docNumber}
                            </span>
                            <button
                              onClick={() => handleCopyNo(doc.docNumber)}
                              title="Salin No. Dokumen"
                              className="text-gray-400 hover:text-brand-maroon transition-colors cursor-pointer"
                            >
                              {copiedDocNum === doc.docNumber ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="font-bold text-gray-900 text-xs mt-1 group-hover:text-brand-maroon transition-colors">
                            {doc.title}
                          </p>
                          {doc.amount && (
                            <span className="text-[11px] font-black text-emerald-700 mt-0.5 block">
                              Nominal: {formatRp(doc.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        {doc.categoryLabel}
                      </span>
                    </td>

                    <td className="px-4 py-4 max-w-[200px] truncate">
                      <span className="text-gray-800 font-semibold">{doc.party}</span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {doc.date}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        doc.statusType === 'success'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : doc.statusType === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : doc.statusType === 'purple'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setActiveModalDoc(doc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-brand-maroon hover:text-white text-gray-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Detail <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Detail Viewer ── */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 text-left relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setActiveModalDoc(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-10 h-10 rounded-xl bg-brand-maroon/10 text-brand-maroon flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono font-bold text-xs text-brand-maroon bg-brand-maroon/5 px-2 py-0.5 rounded">
                  {activeModalDoc.docNumber}
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">{activeModalDoc.title}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">Kategori Dokumen</p>
                <p className="font-semibold text-gray-800 mt-0.5">{activeModalDoc.categoryLabel}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">Tanggal Penerbitan</p>
                <p className="font-mono font-semibold text-gray-800 mt-0.5">{activeModalDoc.date}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">Pihak Terlibat</p>
                <p className="font-semibold text-gray-800 mt-0.5">{activeModalDoc.party}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">Status Dokumen</p>
                <span className="inline-block mt-0.5 font-bold text-emerald-700">
                  {activeModalDoc.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Deskripsi & Klausul Utama</p>
              <p className="text-xs text-gray-600 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 leading-relaxed">
                {activeModalDoc.details}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Path Berkas File</p>
              <div className="flex items-center justify-between gap-2 bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px]">
                <span className="truncate">{activeModalDoc.path}</span>
                <button
                  onClick={() => handleCopyNo(activeModalDoc.path)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Salin Path File"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeModalDoc.tags.map((t) => (
                <span key={t} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleCopyNo(activeModalDoc.docNumber)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Salin No. Dokumen
              </button>
              <button
                onClick={() => setActiveModalDoc(null)}
                className="px-4 py-2 bg-brand-maroon hover:bg-brand-maroon-dark text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
