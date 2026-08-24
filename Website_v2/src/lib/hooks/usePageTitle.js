import { useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePageTitle() {
  const location = useLocation()
  const { id } = useParams()
  
  const { data: rpa } = useQuery({
    queryKey: ['rpa-name', id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await supabase
        .from('rpa_clients')
        .select('rpa_name')
        .eq('id', id)
        .single()
      return data
    },
    enabled: !!id && location.pathname.includes('/rpa/')
  })
  
  const titles = {
    'beranda':    'Beranda',
    'transaksi':  'Transaksi',
    'rpa':        'RPA & Piutang',
    'kandang':    'Kandang',
    'pengiriman': 'Pengiriman',
    'cashflow':   'Cash Flow',
    'armada':     'Armada & Sopir',
    'simulator':  'Simulator Margin',
    'akun':       'Akun',
    'harga-pasar': 'Harga Pasar',
    'siklus':      'Riwayat Siklus',
    'input-harian': 'Input Harian',
    'pakan':       'Stok Pakan',
    'laporan':     'Laporan',
    'farm-beranda': 'Dashboard Kandang',
    'penjualan':   'Penjualan',
    'toko-supplier': 'Toko & Supplier',
    'gudang':      'Gudang Sembako',
    'produk':      'Daftar Produk',
    'daily_task':   'Tugas Harian',
    'task_settings': 'Pengaturan Tugas',
    'batch':        'Daftar Batch',
    'ternak':       'Data Ternak',
    'kesehatan':    'Kesehatan',
    'reproduksi':   'Reproduksi',
  }
  
  if (location.pathname.includes('/rpa/') && id) {
    return rpa?.rpa_name || 'Detail RPA'
  }

  const segments = location.pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  
  return titles[lastSegment] || titles[location.pathname] || 'Dashboard'
}
