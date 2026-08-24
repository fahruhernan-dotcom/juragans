import React from 'react'
import ReactPDF, { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ══════════════════════════════════════════════════════════════════════════════
// 📝 DATA KONTRAK DEFAULT TEMPLATE (DAPAT DISESUAIKAN PER KLIEN VIA ENV/CODE)
// ══════════════════════════════════════════════════════════════════════════════
export const DATA_KONTRAK = {
  nomorSurat: process.env.CONTRACT_NO || '001/SPK-ERP/VIII/2026',
  kota: process.env.CONTRACT_CITY || 'Jakarta',
  hari: process.env.CONTRACT_DAY || 'Senin',
  tanggal: process.env.CONTRACT_DATE || '22 Agustus 2026',
  namaSistem: process.env.SYSTEM_NAME || 'Virgin Dashboard ERP',

  // ── PIHAK PERTAMA (DEVELOPER / PENGEMBANG) ──
  pihakPertama: {
    nama: process.env.DEV_NAME || 'Fahrurosadi Hernan Sakti',
    namaBrand: process.env.DEV_BRAND || 'Ternakos Software',
    alamat: process.env.DEV_ADDRESS || 'Indonesia',
    telepon: process.env.DEV_PHONE || '082133859391',
  },

  // ── PIHAK KEDUA (KLIEN / PEMILIK TOKO) ──
  pihakKedua: {
    nama: process.env.CLIENT_NAME || 'Nama Penanggung Jawab Klien',
    namaUsaha: process.env.CLIENT_BIZ_NAME || 'Nama Usaha / Toko Klien',
    alamat: process.env.CLIENT_ADDRESS || 'Alamat Operasional Bisnis',
    telepon: process.env.CLIENT_PHONE || '08xxxxxxxxxx',
  },

  // ── DATA PEMBAYARAN REKENING ──
  pembayaran: {
    biayaSetup: process.env.SETUP_FEE || 'Rp 1.500.000,-',
    biayaBulanan: process.env.MONTHLY_FEE || 'Rp 500.000,-',
    biayaFiturMinor: process.env.MINOR_FEE || 'Rp 150.000,- s.d. Rp 200.000,-',
    tglJatuhTempo: process.env.DUE_DATE_DAY || '14',
    bank: process.env.BANK_NAME || 'BNI',
    noRekening: process.env.BANK_ACC_NO || '828872449',
    atasNama: process.env.BANK_ACC_NAME || 'Fahrurosadi Hernan Sakti',
  },
}
// ══════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 40,
    paddingHorizontal: 38,
    fontFamily: 'Helvetica',
    fontSize: 8.8,
    lineHeight: 1.42,
    color: '#1E293B',
  },
  headerBox: {
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0F172A',
    paddingBottom: 8,
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 12.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  docNo: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
  },
  preamble: {
    fontSize: 8.2,
    color: '#334155',
    marginBottom: 8,
    textAlign: 'justify',
  },
  partiesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  partyCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    padding: 7,
  },
  partyHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 2.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  partyRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 7.8,
  },
  partyLabel: {
    width: 60,
    color: '#64748B',
    fontFamily: 'Helvetica-Bold',
  },
  partyVal: {
    flex: 1,
    color: '#0F172A',
    fontFamily: 'Helvetica',
  },
  pasalBox: {
    marginBottom: 8,
  },
  pasalTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    borderRadius: 3,
    marginBottom: 3.5,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
  },
  paragraph: {
    fontSize: 8,
    color: '#334155',
    textAlign: 'justify',
    marginBottom: 3,
  },
  bulletList: {
    paddingLeft: 6,
    marginBottom: 3,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 7.8,
    color: '#0F172A',
  },
  bulletText: {
    flex: 1,
    fontSize: 7.8,
    color: '#334155',
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  priceHighlight: {
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  signSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  signTitle: {
    fontSize: 7.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 6,
  },
  signRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    padding: 7,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  signRole: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    marginBottom: 1.5,
  },
  signSub: {
    fontSize: 7,
    color: '#64748B',
    marginBottom: 4,
  },
  meteraiBox: {
    width: 70,
    height: 36,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
  },
  meteraiText: {
    fontSize: 6,
    color: '#64748B',
    fontFamily: 'Helvetica-Bold',
  },
  signLine: {
    width: 110,
    height: 1,
    backgroundColor: '#0F172A',
    marginTop: 3,
    marginBottom: 2.5,
  },
  signName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  signDate: {
    fontSize: 7,
    color: '#64748B',
    marginTop: 1.5,
  },
  footerText: {
    position: 'absolute',
    bottom: 12,
    left: 38,
    right: 38,
    textAlign: 'center',
    fontSize: 7,
    color: '#94A3B8',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 3,
  },
})

const KontrakDocument = ({ data = DATA_KONTRAK }) => (
  <Document>
    {/* ── HALAMAN 1 ── */}
    <Page size="A4" style={s.page}>
      <View style={s.headerBox}>
        <Text style={s.mainTitle}>SURAT PERJANJIAN KERJA SAMA</Text>
        <Text style={s.subTitle}>LAYANAN PENGEMBANGAN, LISENSI SERVER & PEMELIHARAAN SISTEM</Text>
        <Text style={s.docNo}>Nomor: {data.nomorSurat}</Text>
      </View>

      <Text style={s.preamble}>
        Pada hari ini, {data.hari} tanggal {data.tanggal}, bertempat di {data.kota}, disepakati perjanjian kerja sama penggunaan dan pengelolaan perangkat lunak {data.namaSistem || 'Virgin Dashboard ERP'} (Sistem Operasi POS, Inventaris & Manajemen Finansial) oleh dan antara pihak-pihak di bawah ini:
      </Text>

      <View style={s.partiesContainer}>
        <View style={s.partyCard}>
          <Text style={s.partyHeader}>PIHAK PERTAMA (PENGEMBANG / {data.pihakPertama.namaBrand?.toUpperCase() || 'DEVELOPER'})</Text>
          <View style={s.partyRow}><Text style={s.partyLabel}>Nama</Text><Text style={s.partyVal}>: {data.pihakPertama.nama}</Text></View>
          <View style={s.partyRow}><Text style={s.partyLabel}>Usaha / Brand</Text><Text style={s.partyVal}>: {data.pihakPertama.namaBrand}</Text></View>
          <View style={s.partyRow}><Text style={s.partyLabel}>Alamat</Text><Text style={s.partyVal}>: {data.pihakPertama.alamat}</Text></View>
          <View style={s.partyRow}><Text style={s.partyLabel}>No. HP / WA</Text><Text style={s.partyVal}>: {data.pihakPertama.telepon}</Text></View>
        </View>

        <View style={s.partyCard}>
          <Text style={s.partyHeader}>PIHAK KEDUA (KLIEN / {data.pihakKedua.namaUsaha?.toUpperCase() || 'PENGGUNA'})</Text>
          <View style={s.partyRow}><Text style={s.partyLabel}>Nama Klien</Text><Text style={s.partyVal}>: {data.pihakKedua.nama}</Text></View>
          <View style={s.partyRow}><Text style={s.partyLabel}>Nama Usaha</Text><Text style={s.partyVal}>: {data.pihakKedua.namaUsaha}</Text></View>
          <View style={s.partyRow}><Text style={s.partyLabel}>Alamat</Text><Text style={s.partyVal}>: {data.pihakKedua.alamat}</Text></View>
          <View style={s.partyRow}><Text style={s.partyLabel}>No. HP / WA</Text><Text style={s.partyVal}>: {data.pihakKedua.telepon}</Text></View>
        </View>
      </View>

      {/* PASAL 1 */}
      <View style={s.pasalBox}>
        <Text style={s.pasalTitle}>PASAL 1: RUANG LINGKUP SISTEM & LISENSI PENGGUNAAN</Text>
        <Text style={s.paragraph}>
          1. <Text style={s.bold}>Penyediaan Sistem Standar:</Text> PIHAK PERTAMA memberikan hak akses dan lisensi penggunaan aplikasi <Text style={s.bold}>{data.namaSistem || 'Virgin Dashboard ERP'}</Text> yang mencakup modul-modul fungsional standar saat serah terima:
        </Text>
        <View style={s.bulletList}>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Manajemen Produk & Stok:</Text> Katalog produk, konversi multi-satuan bertingkat, stok batch, dan perhitungan HPP terbobot (FIFO).</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Penjualan & Kasir (POS):</Text> Pembuatan faktur, kalkulasi margin laba bersih real-time, pencatatan piutang jatuh tempo, saldo deposit, dan sistem retur barang.</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Logistik & Armada:</Text> Penugasan supir, kendaraan, dan rincian biaya operasional (Bensin, Uang Makan, Tol, Parkir, Bongkar Muat).</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Laporan & Dokumen:</Text> Generator invoice resmi, surat jalan pengiriman, cetak thermal/A4, dan rekap keuangan laba rugi.</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Akses Multi-Platform:</Text> Web Dashboard dan Aplikasi Android (Capacitor/PWA) dengan kapabilitas Offline-First.</Text>
          </View>
        </View>
        <Text style={s.paragraph}>
          2. <Text style={s.bold}>Sifat Hak Pakai (Lisensi):</Text> PIHAK KEDUA menerima Hak Pakai Resmi (SaaS License) selama masa berlangganan aktif. Hak cipta kode sumber (source code), arsitektur, dan kekayaan intelektual sistem tetap sepenuhnya milik sah PIHAK PERTAMA ({data.pihakPertama.namaBrand || 'Developer'}).
        </Text>
      </View>

      {/* PASAL 2 */}
      <View style={s.pasalBox}>
        <Text style={s.pasalTitle}>PASAL 2: BIAYA LAYANAN & SKEMA PEMBAYARAN</Text>
        <View style={s.bulletList}>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>1.</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Biaya Setup & Konfigurasi Awal (One-Time Fee):</Text> Sebesar <Text style={s.priceHighlight}>{data.pembayaran.biayaSetup}</Text> dibayarkan 1 (satu) kali sebelum akun dan server diserahterimakan.</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>2.</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Biaya Langganan Server, Database & Maintenance (Monthly Fee):</Text> Sebesar <Text style={s.priceHighlight}>{data.pembayaran.biayaBulanan} per bulan</Text>, wajib dibayarkan paling lambat tanggal {data.pembayaran.tglJatuhTempo} setiap bulannya.</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>3.</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Biaya Penambahan Fitur Baru (Custom Change Request):</Text> Sebesar <Text style={s.priceHighlight}>{data.pembayaran.biayaFiturMinor} per permintaan fitur minor</Text> dinilai berdasarkan tingkat kesulitan pengerjaan (diatur pada Pasal 4).</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>4.</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Biaya Pihak Ketiga (Third-Party Services):</Text> Biaya layanan berbayar pihak ketiga di luar paket standar (seperti WA Gateway resmi berbayar, domain kustom pribadi) menjadi tanggungan PIHAK KEDUA.</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>5.</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Rekening Pembayaran:</Text> Transfer ke rekening Bank {data.pembayaran.bank} No. Rekening: <Text style={s.bold}>{data.pembayaran.noRekening}</Text> a.n. <Text style={s.bold}>{data.pembayaran.atasNama}</Text>.</Text>
          </View>
        </View>
      </View>

      <Text style={s.footerText}>{data.namaSistem || 'Virgin Dashboard ERP'} • Dokumen Perjanjian Kerja Sama Resmi • Halaman 1 dari 2</Text>
    </Page>

    {/* ── HALAMAN 2 ── */}
    <Page size="A4" style={s.page}>
      {/* PASAL 3 */}
      <View style={s.pasalBox}>
        <Text style={s.pasalTitle}>PASAL 3: GARANSI, PEMELIHARAAN & SERVICE LEVEL AGREEMENT (SLA)</Text>
        <Text style={s.paragraph}>
          1. <Text style={s.bold}>Garansi Bebas Error/Bug:</Text> Selama langganan bulanan aktif, PIHAK PERTAMA menjamin perbaikan error/bug fungsi sistem secara cepat tanpa biaya tambahan.
        </Text>
        <Text style={s.paragraph}>
          2. <Text style={s.bold}>Jam Layanan Bantuan (Support Hours):</Text> Senin – Sabtu, pukul 08.30 – 17.30 WIB. Untuk kendala kritis (server down), penanganan tanggap darurat maksimal 1 – 3 jam.
        </Text>
        <Text style={s.paragraph}>
          3. <Text style={s.bold}>Penyimpanan & Cadangan Data:</Text> PIHAK PERTAMA menjamin ketersediaan server cloud dan pencadangan (backup) data berkala.
        </Text>
      </View>

      {/* PASAL 4 */}
      <View style={s.pasalBox}>
        <Text style={s.pasalTitle}>PASAL 4: PENAMBAHAN FITUR MINOR VS MODUL BESAR</Text>
        <View style={s.bulletList}>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Tingkat Ringan:</Text> Penyesuaian tata letak nota, penambahan tombol shortcut, perubahan label/warna status, filter data sederhana (estimasi pengerjaan &lt; 1 hari).</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Tingkat Sedang:</Text> Penambahan kolom data baru ke database, penyesuaian rumus diskon/margin, validasi form, modifikasi alur pengiriman (estimasi 1–2 hari kerja).</Text>
          </View>
          <View style={s.bulletItem}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}><Text style={s.bold}>Modul Besar / Fitur Mayor:</Text> Permintaan modul besar baru (seperti e-commerce B2C, integrasi timbangan fisik, integrasi software akuntansi eksternal) dibuatkan Surat Penawaran Tambahan (Addendum) terpisah.</Text>
          </View>
        </View>
      </View>

      {/* PASAL 5, 6, 7 */}
      <View style={s.pasalBox}>
        <Text style={s.pasalTitle}>PASAL 5: KETERLAMBATAN BAYAR, SUSPEND & RETENSI DATA</Text>
        <Text style={s.paragraph}>
          Masa tenggang pembayaran iuran adalah 7 (tujuh) hari kalender. Jika belum dibayar, akses sistem dinonaktifkan sementara (suspend). Data tetap tersimpan aman di database selama 30 hari dan langsung aktif kembali setelah pelunasan.
        </Text>
      </View>

      <View style={s.pasalBox}>
        <Text style={s.pasalTitle}>PASAL 6: PELATIHAN & HAK KEKAYAAN INTELEKTUAL</Text>
        <Text style={s.paragraph}>
          1. Biaya setup awal mencakup 1 (satu) kali sesi panduan awal kepada admin/pemilik toko via remote atau video tutorial. Pelatihan staf/kasir baru selanjutnya menjadi tanggung jawab internal klien.
        </Text>
        <Text style={s.paragraph}>
          2. <Text style={s.bold}>Kepemilikan Data:</Text> Seluruh data transaksi, pelanggan, dan keuangan adalah 100% milik mutlak PIHAK KEDUA ({data.pihakKedua.namaUsaha || 'Klien'}).
        </Text>
        <Text style={s.paragraph}>
          3. <Text style={s.bold}>Proteksi Hak Cipta:</Text> PIHAK KEDUA dilarang menyalin kode sumber (reverse engineering) atau menjual kembali (resell) sistem kepada pihak lain.
        </Text>
      </View>

      {/* TANDA TANGAN */}
      <View style={s.signSection}>
        <Text style={s.signTitle}>Perjanjian ini dibuat dalam rangkap 2 (dua) bermeterai cukup dan memiliki kekuatan hukum yang sama.</Text>
        <View style={s.signRow}>
          <View style={s.signBox}>
            <Text style={s.signRole}>PIHAK PERTAMA</Text>
            <Text style={s.signSub}>Pengembang / {data.pihakPertama.namaBrand || 'Developer'}</Text>
            <View style={s.meteraiBox}>
              <Text style={s.meteraiText}>METERAI</Text>
              <Text style={s.meteraiText}>Rp 10.000</Text>
            </View>
            <View style={s.signLine} />
            <Text style={s.signName}>( {data.pihakPertama.nama} )</Text>
            <Text style={s.signDate}>Tgl: {data.tanggal}</Text>
          </View>

          <View style={s.signBox}>
            <Text style={s.signRole}>PIHAK KEDUA</Text>
            <Text style={s.signSub}>Klien / {data.pihakKedua.namaUsaha || 'Pelanggan'}</Text>
            <View style={s.meteraiBox}>
              <Text style={s.meteraiText}>METERAI</Text>
              <Text style={s.meteraiText}>Rp 10.000</Text>
            </View>
            <View style={s.signLine} />
            <Text style={s.signName}>( {data.pihakKedua.nama} )</Text>
            <Text style={s.signDate}>Tgl: {data.tanggal}</Text>
          </View>
        </View>
      </View>

      <Text style={s.footerText}>{data.namaSistem || 'Virgin Dashboard ERP'} • Dokumen Perjanjian Kerja Sama Resmi • Halaman 2 dari 2</Text>
    </Page>
  </Document>
)

async function generatePDF() {
  const outputFileName = process.env.OUTPUT_PDF_NAME || 'KONTRAK_LAYANAN_TEMPLATE.pdf'
  const outputPath = path.resolve(__dirname, '..', 'docs', 'templates', outputFileName)
  console.log('Generating PDF to:', outputPath)
  await ReactPDF.renderToFile(<KontrakDocument data={DATA_KONTRAK} />, outputPath)
  console.log('PDF successfully generated!')
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err)
  process.exit(1)
})
