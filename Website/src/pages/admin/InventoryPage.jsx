import { useState } from 'react'
import { MinusCircle, PlusCircle } from 'lucide-react'

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

export default function InventoryPage({ skus, onRefresh, bridgeStatus }) {
  const [stockEdits, setStockEdits] = useState({})

  const handleUpdateStock = async (skuCode, newQty) => {
    if (bridgeStatus !== 'online') {
      alert('❌ Backend Bridge Offline.')
      return
    }
    try {
      const res = await fetch('http://127.0.0.1:5000/api/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: skuCode, new_stock: Math.max(0, newQty) }),
      })
      if (res.ok) {
        setStockEdits((prev) => ({ ...prev, [skuCode]: undefined }))
        onRefresh()
      } else {
        alert('⚠️ Gagal memperbarui stok.')
      }
    } catch {
      alert('❌ Error koneksi ke backend bridge.')
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Section header */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">Real-time Warehouse Inventory</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Manajemen & Hitung Stok Produk</h2>
        </div>
        <span className="text-xs bg-brand-cream text-brand-maroon font-bold px-4 py-2 rounded-full border border-brand-gold/30">
          daftar_sku_master_produk.csv → Supabase ready
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Kode SKU</th>
              <th className="px-6 py-4">Nama Produk</th>
              <th className="px-6 py-4">Grade</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Jumlah Stok</th>
              <th className="px-6 py-4 text-right">Nilai Aset (HPP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {skus.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                  Memuat data inventory... (pastikan server_bridge.py berjalan)
                </td>
              </tr>
            )}
            {skus.map((sku) => {
              const currentQty =
                stockEdits[sku.Kode_SKU] !== undefined
                  ? stockEdits[sku.Kode_SKU]
                  : parseInt(sku.Stok_Awal) || 0
              const cogs     = parseInt(sku.Total_COGS_Rp) || 0
              const assetVal = currentQty * cogs

              return (
                <tr key={sku.Kode_SKU} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-brand-maroon text-xs">{sku.Kode_SKU}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 max-w-[260px]">
                    <span className="line-clamp-2 leading-snug">{sku.Nama_Produk_Lengkap}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      sku.Grade === 'Grade S Murni' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sku.Grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {currentQty > 20 ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">🟢 Aman</span>
                    ) : currentQty > 0 ? (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">🟡 Restok</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">🔴 Habis</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handleUpdateStock(sku.Kode_SKU, currentQty - 5)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
                      >-5</button>
                      <button
                        onClick={() => handleUpdateStock(sku.Kode_SKU, currentQty - 1)}
                        className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                      ><MinusCircle className="w-5 h-5" /></button>

                      <input
                        type="number"
                        min="0"
                        value={currentQty}
                        onChange={(e) =>
                          setStockEdits((prev) => ({ ...prev, [sku.Kode_SKU]: parseInt(e.target.value) || 0 }))
                        }
                        onBlur={(e) => handleUpdateStock(sku.Kode_SKU, parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-bold text-sm text-gray-900 border border-gray-300 rounded-lg py-1 outline-none focus:border-brand-maroon"
                      />

                      <button
                        onClick={() => handleUpdateStock(sku.Kode_SKU, currentQty + 1)}
                        className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg"
                      ><PlusCircle className="w-5 h-5" /></button>
                      <button
                        onClick={() => handleUpdateStock(sku.Kode_SKU, currentQty + 5)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
                      >+5</button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono text-sm">
                    {formatRp(assetVal)}
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
