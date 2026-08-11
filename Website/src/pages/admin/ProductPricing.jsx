import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { Tag, RefreshCw } from 'lucide-react'

export default function ProductPricing() {
  const [products, setProducts] = useState([
    // 1. Grade A Crispy Satuan & Bundling (JBA)
    { sku: 'JBA-100-TRIAL', name: 'Trial Pack Grade A 100g', category: 'Grade A Crispy', hpp: 13900, solo: 18900, jakarta: 20500, tiktok: 24900, grosir: 15000 },
    { sku: 'JBA-150', name: 'Grade A Pouch 150g', category: 'Grade A Crispy', hpp: 19450, solo: 25000, jakarta: 26500, tiktok: 34900, grosir: 21000 },
    { sku: 'JBA-1K', name: 'Grade A Bal PE 1 Kg', category: 'Grade A Crispy', hpp: 112200, solo: 125000, jakarta: 135500, tiktok: 149000, grosir: 116000 },
    { sku: 'JBA-200', name: 'Grade A Pouch 200g', category: 'Grade A Crispy', hpp: 25100, solo: 31000, jakarta: 31500, tiktok: 42000, grosir: 26000 },
    { sku: 'JBA-250', name: '[HERO SKU] Grade A Pouch 250g', category: 'Grade A Crispy', hpp: 30950, solo: 35000, jakarta: 37500, tiktok: 49900, grosir: 32500 },
    { sku: 'JBA-COMBO150-250', name: '[PAKET COMBO RUMAHAN] Bawang Grade A Paket 150g + 250g', category: 'Grade A Crispy', hpp: 50400, solo: 59000, jakarta: 64000, tiktok: 82900, grosir: 53500 },
    { sku: 'JBA-HORECA-2KG', name: '[SUPLAI RESTORAN & KULINER] Bawang Grade A 2 kg Bal PE', category: 'Grade A Crispy', hpp: 217200, solo: 250000, jakarta: 271000, tiktok: 289000, grosir: 232000 },
    { sku: 'JBA-PAKET2X250', name: '[PAKET HEMAT BUNDLING] Bawang Grade A 250g isi 2 Pouch', category: 'Grade A Crispy', hpp: 61900, solo: 70000, jakarta: 75000, tiktok: 98900, grosir: 65000 },
    { sku: 'JBA-PAKETGROSIR1KG', name: '[PAKET SUPER GROSIR] Bawang Grade A 1 kg (2x 500g)', category: 'Grade A Crispy', hpp: 117400, solo: 130000, jakarta: 141000, tiktok: 168000, grosir: 122000 },

    // 2. Grade S Murni Satuan & Bundling (JBM)
    { sku: 'JBM-100-TRIAL', name: 'Trial Pack Murni 100g', category: 'Grade S Murni', hpp: 15400, solo: 21600, jakarta: 23500, tiktok: 29900, grosir: 18000 },
    { sku: 'JBM-150', name: 'Murni Pouch 150g', category: 'Grade S Murni', hpp: 21700, solo: 26000, jakarta: 26500, tiktok: 42900, grosir: 25000 },
    { sku: 'JBM-1K', name: 'Murni Bal PE 1 Kg', category: 'Grade S Murni', hpp: 127200, solo: 152000, jakarta: 165500, tiktok: 179000, grosir: 135000 },
    { sku: 'JBM-200', name: 'Murni Pouch 200g', category: 'Grade S Murni', hpp: 28200, solo: 34500, jakarta: 37500, tiktok: 52900, grosir: 32000 },
    { sku: 'JBM-250', name: '[HERO SKU] Murni Pouch 250g', category: 'Grade S Murni', hpp: 34700, solo: 40000, jakarta: 43500, tiktok: 64900, grosir: 39500 },
    { sku: 'JBM-COMBO150-250', name: '[PAKET COMBO RUMAHAN] Bawang Murni Paket 150g + 250g', category: 'Grade S Murni', hpp: 56400, solo: 64500, jakarta: 70000, tiktok: 105000, grosir: 64500 },
    { sku: 'JBM-HORECA-2KG', name: '[SUPLAI RESTORAN & KULINER] Bawang Murni 2 kg Bal PE', category: 'Grade S Murni', hpp: 247200, solo: 304000, jakarta: 331000, tiktok: 349000, grosir: 270000 },
    { sku: 'JBM-PAKET2X250', name: '[PAKET HEMAT BUNDLING] Bawang Murni 250g isi 2 Pouch', category: 'Grade S Murni', hpp: 69400, solo: 80000, jakarta: 87000, tiktok: 129000, grosir: 79000 },
    { sku: 'JBM-PAKETGROSIR1KG', name: '[PAKET SUPER GROSIR] Bawang Murni 1 kg (2x 500g)', category: 'Grade S Murni', hpp: 132400, solo: 148000, jakarta: 161000, tiktok: 215000, grosir: 148000 }
  ])

  const fetchProducts = async () => {
    try {
      if (!isSupabaseConfigured()) return
      const { data, error } = await supabase
        .from('juragan_products')
        .select('*')
        .eq('is_active', true)

      if (!error && data && data.length > 0) {
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
      }
    } catch (e) {
      console.warn('Fallback to local product pricing:', e)
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
              {products.map((p) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
