import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { Wallet, Plus, UserCheck } from 'lucide-react'

export default function ExpensesPayroll() {
  const [expenses, setExpenses] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'stiker', description: '', amount: '', paid_by: 'Owner', notes: '' })

  const fetchExpensesAndPayroll = async () => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setLoading(false)
        return
      }

      const { data: expData, error: expErr } = await supabase
        .from('juragan_expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (!expErr && expData) {
        setExpenses(expData)
      } else {
        setExpenses([])
      }

      const { data: payData, error: payErr } = await supabase
        .from('juragan_payroll')
        .select('*')
        .order('created_at', { ascending: false })

      if (!payErr && payData) {
        setPayrolls(payData.map(p => ({ ...p, member: p.team_member, type: p.transaction_type })))
      } else {
        setPayrolls([])
      }
    } catch (e) {
      console.warn('Error fetching expenses/payroll:', e)
      setExpenses([])
      setPayrolls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpensesAndPayroll()
  }, [])

  const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  
  const totalDidi = expenses.filter(e => e.paid_by === 'Didi').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const totalFahru = expenses.filter(e => e.paid_by === 'Fahru' || e.paid_by === 'Owner').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const totalReyhan = expenses.filter(e => e.paid_by === 'Reyhan').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const totalTalanganTim = totalDidi + totalFahru + totalReyhan

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!newExpense.description || !newExpense.amount) return

    const parsedAmount = parseFloat(newExpense.amount) || 0

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('juragan_expenses')
          .insert([{
            category: newExpense.category,
            description: newExpense.description,
            amount: parsedAmount,
            paid_by: newExpense.paid_by,
            notes: newExpense.notes
          }])
          .select()

        if (!error && data) {
          setExpenses([data[0], ...expenses])
        }
      } else {
        const item = {
          id: Date.now().toString(),
          category: newExpense.category,
          description: newExpense.description,
          amount: parsedAmount,
          paid_by: newExpense.paid_by,
          created_at: new Date().toISOString(),
          notes: newExpense.notes
        }
        setExpenses([item, ...expenses])
      }
    } catch (err) {
      console.error('Failed to insert expense:', err)
    }

    setIsAddExpenseModalOpen(false)
    setNewExpense({ category: 'stiker', description: '', amount: '', paid_by: 'Owner', notes: '' })
  }

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark p-6 rounded-2xl text-white shadow-lg border border-brand-gold/30">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Keuangan & Kas Tim</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">Pengeluaran Operasional & Klaim Tim</h2>
          <p className="text-xs text-brand-cream/80 mt-1">Pencatatan biaya operasional, pengadaan stiker, dan klaim talangan seluruh tim yang belum ditukar</p>
        </div>
        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-xs font-semibold text-brand-charcoal/70 uppercase">Total Biaya Operasional</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">Rp {totalExpense.toLocaleString('id-ID')}</p>
          <p className="text-xs text-brand-charcoal/60 mt-1">Pengeluaran tercatat (Stiker, Kemasan, Stok Pabrik)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-xs font-semibold text-brand-charcoal/70 uppercase">Total Talangan Tim (Belum Ditukar)</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">Rp {totalTalanganTim.toLocaleString('id-ID')}</p>
          <p className="text-xs text-amber-700 mt-1">Total piutang klaim/reimburse seluruh anggota tim</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-xs font-semibold text-brand-charcoal/70 uppercase">Rincian Talangan Per Anggota</span>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-brand-charcoal/70">Didi:</span>
              <span className="text-amber-700 font-bold">Rp {totalDidi.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-brand-charcoal/70">Fahru:</span>
              <span className="text-amber-700 font-bold">Rp {totalFahru.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-brand-charcoal/70">Reyhan:</span>
              <span className="text-emerald-600 font-bold">Rp {totalReyhan.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-brand-gold/30 shadow-sm overflow-hidden">
          <div className="p-4 bg-brand-cream/40 border-b border-brand-gold/20 flex justify-between items-center">
            <h3 className="font-bold text-sm text-brand-maroon flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Biaya Operasional Usaha</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-charcoal text-brand-gold uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Deskripsi Pengeluaran</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Dibayar Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-maroon/10">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-cream/20">
                    <td className="p-3 font-semibold text-brand-charcoal">
                      <div>{e.description}</div>
                      <div className="text-[10px] text-brand-charcoal/60">{e.notes}</div>
                    </td>
                    <td className="p-3 font-bold text-rose-600">Rp {e.amount.toLocaleString('id-ID')}</td>
                    <td className="p-3 font-bold text-brand-maroon">{e.paid_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Payroll & Reimburse Table */}
        <div className="bg-white rounded-2xl border border-brand-gold/30 shadow-sm overflow-hidden">
          <div className="p-4 bg-brand-cream/40 border-b border-brand-gold/20 flex justify-between items-center">
            <h3 className="font-bold text-sm text-brand-maroon flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Klaim Pengeluaran & Pembukuan Tim (Didi & Reyhan)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-charcoal text-brand-gold uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Anggota Tim</th>
                  <th className="p-3">Jenis Transaksi</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-maroon/10">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-cream/20">
                    <td className="p-3 font-bold text-brand-maroon">{p.member}</td>
                    <td className="p-3 capitalize font-semibold">
                      {p.type === 'pengeluaran_ops' || p.type === 'setoran' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px]">Pengeluaran Ops (Belum Ditukar)</span>
                      ) : p.type === 'klaim_stiker' ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px]">Klaim Stiker (Belum Ditukar)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px]">{p.type}</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-amber-600">Rp {p.amount.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-brand-charcoal/70">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add Expense */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-2 border-brand-gold p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <h3 className="font-bold text-lg text-brand-maroon border-b border-brand-maroon/10 pb-3">Catat Biaya Operasional Baru</h3>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-brand-charcoal block mb-1">Deskripsi Pengeluaran</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Biaya Bensin Sales Kanvas"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-brand-charcoal block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-brand-charcoal block mb-1">Dibayar Oleh</label>
                  <select
                    value={newExpense.paid_by}
                    onChange={(e) => setNewExpense({ ...newExpense, paid_by: e.target.value })}
                    className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Didi">Didi</option>
                    <option value="Reyhan">Reyhan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-brand-charcoal block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan opsional"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-maroon text-white font-bold rounded-xl shadow hover:bg-brand-maroon-dark transition-all cursor-pointer"
                >
                  Simpan Biaya
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2.5 border border-brand-maroon/20 text-brand-charcoal font-semibold rounded-xl hover:bg-brand-cream"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
