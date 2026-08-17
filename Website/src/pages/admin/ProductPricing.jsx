import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { Tag, RefreshCw } from 'lucide-react'

export default function ProductPricing() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('juragan_products')
        .select('*')
        .eq('is_active', true)

      if (!error && data) {
        // Sort alphabetically by SKU to place JBA first and JBM second
        const sorted = [...data].sort((a, b) => {
          const skuA = (a.sku || '').toUpperCase()
          const skuB = (b.sku || '').toUpperCase()
          return skuA.localeCompare(skuB)
        })

        setProducts(sorted.map(p => ({
          sku: p.sku,
          name: p.product_name,
          category: p.category,
          hpp: parseFloat(p.hpp_per_unit) || 0,
          solo: parseFloat(p.harga_solo_rp) || 0,
          jakarta: parseFloat(p.harga_pusat_rp) || 0,
          tiktok: parseFloat(p.harga_marketplace_promo_rp) || 0,
          grosir: parseFloat(p.harga_grosir_offline_rp) || 0
        })))
      } else {
        setProducts([])
      }
    } catch (e) {
      console.warn('Error fetching product pricing from Supabase:', e)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark p-6 rounded-2xl text-white shadow-lg border border-brand-gold/30">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Katalog & Pricing Master</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">Master SKU & Perbandingan Pricing Regional</h2>
          <p className="text-xs text-brand-cream/80 mt-1">Acuan HPP Pabrik Boyolali serta Matriks Harga Regional: Pasar Solo Raya (Lokal) vs Pasar Jakarta & Semarang</p>
        </div>
      </div>

      {/* Pricing Matrix Table */}
      <div className="bg-white rounded-2xl border border-brand-gold/30 shadow-sm overflow-hidden">
        <div className="p-4 bg-brand-cream/40 border-b border-brand-gold/20 flex justify-between items-center">
          <h3 className="font-bold text-sm text-brand-maroon flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Matriks Harga Produk (Pasar Solo Raya vs Pasar Jakarta & Semarang)</span>
          </h3>
          <button
            onClick={fetchProducts}
            className="p-1.5 text-brand-maroon hover:bg-brand-maroon/10 rounded-lg transition-colors cursor-pointer"
            title="Refresh Data Produk"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-charcoal text-brand-gold uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Kode SKU</th>
                <th className="p-3">Nama Varian Produk</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">HPP Total</th>
                <th className="p-3 text-emerald-400 bg-emerald-950/40 border-l border-emerald-800/40">🛍️ Harga Solo</th>
                <th className="p-3 text-emerald-300 bg-emerald-950/40">Profit Solo (Rp / %)</th>
                <th className="p-3 text-amber-300 bg-amber-950/40 border-l border-amber-800/40">🏙️ Harga Pusat</th>
                <th className="p-3 text-amber-200 bg-amber-950/40">Profit Pusat (Rp / %)</th>
                <th className="p-3">TikTok Shop</th>
                <th className="p-3">Grosir Offline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-maroon/10">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-stone-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-maroon" />
                      <span>Memuat data produk dari Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const profitSolo = p.solo - p.hpp
                  const profitSoloPct = p.solo > 0 ? ((profitSolo / p.solo) * 100).toFixed(1) : '0.0'
                  const profitPusat = p.jakarta - p.hpp
                  const profitPusatPct = p.jakarta > 0 ? ((profitPusat / p.jakarta) * 100).toFixed(1) : '0.0'

                  return (
                    <tr key={p.sku} className="hover:bg-brand-cream/20 transition-colors">
                      <td className="p-3 font-bold font-mono text-brand-maroon">{p.sku}</td>
                      <td className="p-3 font-semibold text-brand-charcoal">{p.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.category.includes('Grade S') ? 'bg-amber-100 text-amber-900' : p.category.includes('Grade A') ? 'bg-emerald-100 text-emerald-900' : 'bg-purple-100 text-purple-900'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-brand-charcoal/80">Rp {p.hpp.toLocaleString('id-ID')}</td>

                      {/* Harga & Profit Solo */}
                      <td className="p-3 font-extrabold text-emerald-700 bg-emerald-50/60 border-l border-emerald-200/60">
                        Rp {p.solo.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 font-bold text-emerald-800 bg-emerald-50/30">
                        Rp {profitSolo.toLocaleString('id-ID')} <span className="text-[10px] opacity-80">({profitSoloPct}%)</span>
                      </td>

                      {/* Harga & Profit Pusat */}
                      <td className="p-3 font-extrabold text-brand-maroon bg-amber-50 border-l border-amber-200">
                        Rp {p.jakarta.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 font-bold text-amber-900 bg-amber-50/40">
                        Rp {profitPusat.toLocaleString('id-ID')} <span className="text-[10px] text-emerald-700 font-extrabold">({profitPusatPct}%)</span>
                      </td>

                      <td className="p-3 font-medium">Rp {p.tiktok.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-bold text-brand-charcoal">Rp {p.grosir.toLocaleString('id-ID')}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-stone-400">
                    <p className="font-semibold text-stone-600">Belum ada produk di database (juragan_products)</p>
                    <p className="text-xs text-stone-400 mt-1">Data akan otomatis tampil setelah diinput / diimpor ke database.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
