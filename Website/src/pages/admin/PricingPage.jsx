import { useState } from 'react'
import { Save } from 'lucide-react'

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

export default function PricingPage({ skus, onRefresh, bridgeStatus }) {
  const [priceEdits, setPriceEdits] = useState({})
  const [saving, setSaving] = useState(null)

  const getEdit = (skuCode, field, fallback) =>
    priceEdits[skuCode]?.[field] !== undefined ? priceEdits[skuCode][field] : fallback

  const setEdit = (skuCode, field, value) =>
    setPriceEdits((prev) => ({
      ...prev,
      [skuCode]: { ...(prev[skuCode] || {}), [field]: value },
    }))

  const handleSave = async (sku) => {
    if (bridgeStatus !== 'online') {
      alert('❌ Backend Bridge Offline.')
      return
    }
    const cogs  = getEdit(sku.Kode_SKU, 'cogs',  parseInt(sku.Total_COGS_Rp) || 0)
    const promo = getEdit(sku.Kode_SKU, 'promo', parseInt(sku.Harga_Promo_Jual_Rp) || 0)

    setSaving(sku.Kode_SKU)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/update-sku-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: sku.Kode_SKU, cogs, promo }),
      })
      if (res.ok) {
        alert(`🎉 HPP/Harga SKU ${sku.Kode_SKU} berhasil diperbarui!`)
        onRefresh()
      } else {
        alert('⚠️ Gagal memperbarui harga.')
      }
    } catch {
      alert('❌ Error koneksi ke backend bridge.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">Master Pricing Manager</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Pengaturan HPP & Harga Jual SKU</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-full">
            ✓ Margin dihitung otomatis
          </span>
          <span className="text-xs bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-full">
            Supabase ready
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-5 py-4">Kode SKU</th>
              <th className="px-5 py-4">Nama Produk</th>
              <th className="px-5 py-4">HPP / COGS (Rp)</th>
              <th className="px-5 py-4">Harga Promo TikTok (Rp)</th>
              <th className="px-5 py-4">Net Profit Saat Ini</th>
              <th className="px-5 py-4">Margin %</th>
              <th className="px-5 py-4 text-center">Simpan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {skus.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                  Memuat data harga... (pastikan server_bridge.py berjalan)
                </td>
              </tr>
            )}
            {skus.map((sku) => {
              const cogs      = getEdit(sku.Kode_SKU, 'cogs',  parseInt(sku.Total_COGS_Rp) || 0)
              const promo     = getEdit(sku.Kode_SKU, 'promo', parseInt(sku.Harga_Promo_Jual_Rp) || 0)
              const netProfit = parseInt(sku.Net_Profit_Bersih_Rp) || 0
              const margin    = parseFloat(sku.Margin_Net_Pct) || 0
              const isSaving  = saving === sku.Kode_SKU

              return (
                <tr key={sku.Kode_SKU} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-brand-maroon text-xs">{sku.Kode_SKU}</td>
                  <td className="px-5 py-4 font-bold text-gray-900 max-w-[240px]">
                    <span className="line-clamp-2 leading-snug text-xs">{sku.Nama_Produk_Lengkap}</span>
                  </td>

                  {/* HPP input */}
                  <td className="px-5 py-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                      <input
                        type="number"
                        value={cogs}
                        onChange={(e) => setEdit(sku.Kode_SKU, 'cogs', parseInt(e.target.value) || 0)}
                        className="w-28 pl-8 font-mono font-bold text-sm text-gray-900 border border-gray-300 rounded-lg py-1.5 outline-none focus:border-brand-maroon"
                      />
                    </div>
                  </td>

                  {/* Harga promo input */}
                  <td className="px-5 py-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                      <input
                        type="number"
                        value={promo}
                        onChange={(e) => setEdit(sku.Kode_SKU, 'promo', parseInt(e.target.value) || 0)}
                        className="w-28 pl-8 font-mono font-bold text-sm text-brand-maroon border border-gray-300 rounded-lg py-1.5 outline-none focus:border-brand-maroon"
                      />
                    </div>
                  </td>

                  {/* Net profit */}
                  <td className="px-5 py-4">
                    <span className={`font-mono font-bold text-sm ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatRp(netProfit)}
                    </span>
                  </td>

                  {/* Margin */}
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      margin >= 20 ? 'bg-emerald-100 text-emerald-800' :
                      margin >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>

                  {/* Save button */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleSave(sku)}
                      disabled={isSaving}
                      className="py-1.5 px-4 bg-brand-maroon hover:bg-brand-maroon-dark disabled:bg-gray-400 text-white rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 mx-auto transition-all active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
