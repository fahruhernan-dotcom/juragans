import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, DollarSign, CalendarCheck, Check, Lock, Pencil, Clock, CheckCircle2, ShieldAlert, X } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import {
  useSembakoEmployees, useSembakoPayrolls,
  useCreateSembakoEmployee, useUpdateSembakoEmployee,
  useRecordPayroll, useMarkPayrollPaid,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import {
  C, sInput, sBtn, sLabel, fmtDate, InputRupiah, CustomSelect,
} from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { cn } from '@/lib/utils'

const SALARY_TYPES = [
  { value: 'harian', label: 'Harian', color: '#60A5FA' },
  { value: 'bulanan', label: 'Bulanan', color: '#10B981' },
  { value: 'borongan', label: 'Borongan', color: '#F59E0B' },
  { value: 'komisi', label: 'Komisi', color: '#A78BFA' },
  { value: 'campuran', label: 'Campuran', color: '#0F172A' },
]
const STATUS_COLOR = { aktif: '#10B981', nonaktif: '#EF4444', cuti: '#F59E0B' }
const ROLES = ['gudang', 'sales', 'kurir', 'admin', 'lainnya']

const inputClass = "w-full bg-slate-550 dark:bg-white/[0.02] border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 font-bold transition-all"
const labelClass = "block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5"

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoPegawai({ hideMobileHeader }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const { tenant } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'
  const [tab, setTab] = useState('pegawai')

  const tabs = [
    { id: 'pegawai', label: 'Data Karyawan' },
    { id: 'payroll', label: 'Gaji & Payroll' },
  ]

  if (isStarter) {
    return (
      <div className="bg-background min-h-screen">
        {(!isDesktop && !hideMobileHeader) && <BrokerMobileHeader title="Pegawai" onMenuClick={() => setSidebarOpen(true)} />}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#0F172A]/10 border border-[#0F172A]/20">
            <Lock size={28} className="text-[#0F172A]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 bg-[#0F172A]/10 border border-[#0F172A]/20">
              <Users size={11} className="text-[#0F172A]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">Fitur Pro</span>
            </div>
            <h2 className="font-sans font-black text-xl text-foreground mb-2">Karyawan & Payroll</h2>
            <p className="text-sm max-w-xs leading-relaxed text-muted-foreground">
              Kelola data karyawan, jadwal gaji, dan rekap payroll tersedia di plan{' '}
              <span className="text-foreground font-bold">Pro</span> dan <span className="text-foreground font-bold">Business</span>.
            </p>
          </div>
          <Link
            to="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-colors bg-[#0F172A] hover:bg-slate-900 shadow-lg shadow-slate-950/10 active:scale-95 cursor-pointer"
          >
            Lihat Paket Pro →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen text-foreground pb-28 text-left">
      {(!isDesktop && !hideMobileHeader) && <BrokerMobileHeader title="Karyawan & Gaji" onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title="Karyawan & Gaji"
          subtitle="Manajemen data pegawai, remunerasi, komisi sales, dan rekap payroll bulanan"
          isDesktop={isDesktop}
          filters={tabs}
          activeFilter={tab}
          onFilterChange={setTab}
          actionButton={
            tab === 'pegawai' ? (
              <button
                onClick={() => window.dispatchEvent(new Event('open-new-employee'))}
                className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-slate-900 text-white transition-all cursor-pointer shadow-lg shadow-slate-950/10 active:scale-95 shrink-0"
              >
                <Plus size={16} />
                <span>Tambah Karyawan</span>
              </button>
            ) : null
          }
        />

        <div className="px-4 sm:px-6 pt-2">
          {tab === 'pegawai' ? <TabPegawai isDesktop={isDesktop} /> : <TabPayroll isDesktop={isDesktop} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: DATA PEGAWAI
// ═══════════════════════════════════════════════════════════════════════════
function TabPegawai({ isDesktop }) {
  const { data: employees = [], isError, error, refetch } = useSembakoEmployees()
  const createEmp = useCreateSembakoEmployee()
  const updateEmp = useUpdateSembakoEmployee()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  const { tenant } = useAuth()
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['profiles', 'team', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('tenant_id', tenant.id).order('created_at');
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    const handleOpen = () => openNew()
    window.addEventListener('open-new-employee', handleOpen)
    return () => window.removeEventListener('open-new-employee', handleOpen)
  }, [employees])

  function openNew() {
    setForm({
      full_name: '', role: 'gudang', phone: '', address: '', join_date: new Date().toISOString().slice(0, 10),
      salary_type: 'bulanan', base_salary: 0, commission_pct: 0, trip_rate: 0, notes: '',
      profile_id: 'none', status: 'aktif', pay_day: 'Tanggal 1'
    })
    setEditing('new')
  }
  function openEdit(e) { setForm({ ...e, profile_id: e.profile_id || 'none', status: e.status || 'aktif', pay_day: e.pay_day || 'Tanggal 1' }); setEditing(e) }

  async function handleSave() {
    if (!form.full_name) return
    const payload = { ...form }
    if (payload.profile_id === 'none') payload.profile_id = null
    if (editing === 'new') await createEmp.mutateAsync(payload)
    else await updateEmp.mutateAsync({ id: editing.id, ...payload })
    setEditing(null)
  }

  // Summary Strip Stats
  const activeCount = employees.filter(e => e.status === 'aktif').length
  const avgSalary = Math.round(employees.reduce((acc, curr) => acc + (curr.base_salary || 0), 0) / (employees.length || 1))
  const summaryItems = [
    { label: 'Total Karyawan', value: `${employees.length} Orang`, color: 'amber', subLabel: 'Aktif & nonaktif' },
    { label: 'Karyawan Aktif', value: `${activeCount} Orang`, color: 'green', subLabel: 'Siap bekerja' },
    { label: 'Rata-rata Gaji', value: avgSalary, isCurrency: true, color: 'default', subLabel: 'Rata-rata Gaji Pokok' },
  ]

  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <SembakoSummaryStrip items={summaryItems} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => {
          const stColor = STATUS_COLOR[emp.status] || C.muted
          const salType = SALARY_TYPES.find(s => s.value === emp.salary_type)
          return (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openEdit(emp)}
              className="bg-card border border-border/60 hover:border-slate-500/30 rounded-2xl p-5 transition-all shadow-sm cursor-pointer flex flex-col justify-between group hover:shadow-md relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0F172A]/10 border border-[#0F172A]/20 flex items-center justify-center text-base font-black text-[#0F172A] shrink-0 uppercase">
                    {(emp.full_name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-foreground group-hover:text-[#0F172A] transition-colors truncate">
                      {emp.full_name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#0F172A]/10 text-amber-400 border border-[#0F172A]/20">
                        {emp.role}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                        emp.status === 'aktif'
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : emp.status === 'cuti'
                            ? "bg-[#0F172A]/10 text-amber-400 border-[#0F172A]/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {emp.phone && (
                  <p className="text-[11px] text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
                    <span className="opacity-50">📱</span> {emp.phone}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-border/40 text-[11px] text-muted-foreground font-bold mt-2">
                <span className="capitalize">{salType ? salType.label : emp.salary_type}</span>
                <span className="text-foreground font-black text-xs">
                  {emp.base_salary > 0 ? formatIDR(emp.base_salary) : ''}
                  {emp.commission_pct > 0 ? ` + ${emp.commission_pct}%` : ''}
                </span>
              </div>
            </motion.div>
          )
        })}

        {employees.length === 0 && (
          <div className="bg-card border border-border/60 rounded-2xl p-12 text-center text-muted-foreground col-span-full">
            <Users size={36} className="mx-auto mb-3 opacity-30 text-[#0F172A]" />
            <p className="text-base font-bold text-foreground">Belum ada data pegawai</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Klik "Tambah Karyawan" di atas untuk mulai menambahkan data pegawai gudang, sales, atau sopir Anda.
            </p>
          </div>
        )}
      </div>

      {/* CRUD Sheet */}
      <Sheet open={editing !== null} onOpenChange={v => !v && setEditing(null)}>
        <SheetContent
          side="right"
          className="bg-card border-l border-border/60 p-6 overflow-y-auto w-full max-w-md flex flex-col h-full text-left"
        >
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-lg font-black text-foreground">
              {editing === 'new' ? 'Tambah Karyawan' : 'Edit Karyawan'}
            </SheetTitle>
            <SheetDescription className="sr-only">Form untuk mengelola data pegawai sales & staf operasional.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-4 pt-5 pb-20 text-xs">
            <div>
              <label className={labelClass}>Nama Lengkap *</label>
              <input
                id="emp-name"
                name="full_name"
                className={inputClass}
                value={form.full_name || ''}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ketik nama lengkap..."
              />
            </div>

            <div>
              <label className={labelClass}>Link ke Akun Tim</label>
              <CustomSelect
                id="emp-profile"
                value={form.profile_id || 'none'}
                onChange={val => setForm({ ...form, profile_id: val })}
                options={[
                  { value: 'none', label: '— Tidak terhubung —' },
                  ...teamMembers.map(m => ({ value: m.id, label: `${m.full_name} (${m.role})` }))
                ]}
                placeholder="— Tidak terhubung —"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                Hubungkan pegawai ke akun tim agar mempermudah monitoring logistik dan pengiriman.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Role</label>
                <CustomSelect
                  id="emp-role"
                  value={form.role || 'gudang'}
                  onChange={val => setForm({ ...form, role: val })}
                  options={ROLES.map(r => ({ value: r, label: r.toUpperCase() }))}
                  placeholder="Pilih role"
                />
              </div>
              <div>
                <label className={labelClass}>No HP</label>
                <PhoneInput
                  id="emp-phone"
                  name="phone"
                  className={inputClass}
                  value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Alamat</label>
              <input
                id="emp-addr"
                name="address"
                className={inputClass}
                value={form.address || ''}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Alamat tempat tinggal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tanggal Masuk</label>
                <DatePicker
                  id="emp-join"
                  value={form.join_date || ''}
                  onChange={val => setForm({ ...form, join_date: val })}
                  placeholder="Pilih tanggal"
                />
              </div>
              <div>
                <label className={labelClass}>Tipe Gaji</label>
                <CustomSelect
                  value={form.salary_type || 'bulanan'}
                  onChange={val => setForm({ ...form, salary_type: val })}
                  options={SALARY_TYPES}
                  placeholder="Pilih tipe"
                />
              </div>
            </div>

            {/* Dynamic salary fields */}
            {(form.salary_type === 'harian' || form.salary_type === 'bulanan' || form.salary_type === 'campuran') && (
              <div>
                <label className={labelClass}>Gaji Pokok {form.salary_type === 'harian' ? '(Per Hari)' : '(Per Bulan)'}</label>
                <InputRupiah value={form.base_salary || 0} onChange={v => setForm({ ...form, base_salary: v })} />
              </div>
            )}
            {(form.salary_type === 'borongan' || form.salary_type === 'campuran') && (
              <div>
                <label className={labelClass}>Tarif Per Trip</label>
                <InputRupiah value={form.trip_rate || 0} onChange={v => setForm({ ...form, trip_rate: v })} />
              </div>
            )}
            {(form.salary_type === 'komisi' || form.salary_type === 'campuran') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Komisi (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className={inputClass}
                    value={form.commission_pct || ''}
                    onChange={e => setForm({ ...form, commission_pct: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {form.salary_type === 'komisi' && (
                  <div>
                    <label className={labelClass}>Gaji Pokok (Opsional)</label>
                    <InputRupiah value={form.base_salary || 0} onChange={v => setForm({ ...form, base_salary: v })} />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={labelClass}>Hari Gajian</label>
              <CustomSelect
                value={form.pay_day || 'Tanggal 1'}
                onChange={val => setForm({ ...form, pay_day: val })}
                options={Array.from({ length: 28 }, (_, i) => ({ value: `Tanggal ${i + 1}`, label: `Tanggal ${i + 1}` }))}
                placeholder="Pilih tanggal"
              />
            </div>

            <div>
              <label className={labelClass}>Status Kerja</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'aktif', label: '✅ Aktif' },
                  { value: 'nonaktif', label: '⛔ Nonaktif' },
                ].map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm({ ...form, status: s.value })}
                    className={cn(
                      "h-10 rounded-xl border font-bold transition-all text-xs cursor-pointer",
                      form.status === s.value
                        ? (s.value === 'aktif'
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500 bg-red-500/10 text-red-400")
                        : "border-border/60 bg-slate-550 dark:bg-white/[0.01] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Catatan</label>
              <textarea
                rows={2}
                className="w-full bg-slate-550 dark:bg-white/[0.02] border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 resize-none font-bold"
                value={form.notes || ''}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan tambahan (opsional)..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={createEmp.isPending || updateEmp.isPending}
              className="w-full h-11 bg-[#0F172A] hover:bg-slate-900 font-bold text-white rounded-xl shadow-lg shadow-slate-950/10 transition-all mt-2 cursor-pointer flex items-center justify-center"
            >
              {(createEmp.isPending || updateEmp.isPending) ? 'Menyimpan...' : 'Simpan Karyawan'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: GAJI & PAYROLL
// ═══════════════════════════════════════════════════════════════════════════
function TabPayroll({ isDesktop }) {
  const { data: employees = [], isError: isEmpError, error: empError, refetch: refetchEmp } = useSembakoEmployees()
  const { data: payrolls = [], isError: isPayError, error: payError, refetch: refetchPay } = useSembakoPayrolls()
  const recordPayroll = useRecordPayroll()
  const markPaid = useMarkPayrollPaid()

  const [filterMonth, setFilterMonth] = useState('')
  const [filterEmp, setFilterEmp] = useState('')

  // ── Payroll form state ──
  const [empId, setEmpId] = useState('')
  const [periodDate, setPeriodDate] = useState(new Date().toISOString().slice(0, 10))
  const [workDays, setWorkDays] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  const [salesAmount, setSalesAmount] = useState(0)
  const [bonus, setBonus] = useState(0)
  const [deduction, setDeduction] = useState(0)
  const [payNotes, setPayNotes] = useState('')

  const selectedEmp = employees.find(e => e.id === empId)

  // Auto-calc when employee selected or inputs change
  const calcBase = useMemo(() => {
    if (!selectedEmp) return 0
    const st = selectedEmp.salary_type
    if (st === 'harian') return workDays * (selectedEmp.base_salary || 0)
    if (st === 'bulanan') return selectedEmp.base_salary || 0
    if (st === 'borongan') return tripCount * (selectedEmp.trip_rate || 0)
    if (st === 'komisi') return selectedEmp.base_salary || 0
    if (st === 'campuran') return (workDays > 0 ? workDays * (selectedEmp.base_salary || 0) : (selectedEmp.base_salary || 0)) + tripCount * (selectedEmp.trip_rate || 0)
    return 0
  }, [selectedEmp, workDays, tripCount])

  const calcComm = useMemo(() => {
    if (!selectedEmp || !selectedEmp.commission_pct) return 0
    return Math.round(salesAmount * selectedEmp.commission_pct / 100)
  }, [selectedEmp, salesAmount])

  const totalPay = calcBase + calcComm + bonus - deduction

  function handleSelectEmp(id) {
    setEmpId(id)
    setWorkDays(0); setTripCount(0); setSalesAmount(0); setBonus(0); setDeduction(0)
  }

  async function handleSubmit() {
    if (!empId) return
    const st = selectedEmp?.salary_type || 'bulanan'
    await recordPayroll.mutateAsync({
      employee_id: empId,
      period_type: st === 'campuran' ? 'bulanan' : st,
      period_date: periodDate,
      work_days: workDays || 0,
      trip_count: tripCount || 0,
      sales_amount: salesAmount || 0,
      base_amount: calcBase,
      commission_amount: calcComm,
      bonus, deduction, notes: payNotes,
    })
    setEmpId(''); setWorkDays(0); setTripCount(0); setSalesAmount(0); setBonus(0); setDeduction(0); setPayNotes('')
  }

  // Summary
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 86400000)
  const thisMonthPayrolls = payrolls.filter(p => new Date(p.period_date) > thirtyDaysAgo)
  const totalPaid = thisMonthPayrolls.filter(p => p.payment_status === 'paid').reduce((s, p) => s + (p.total_pay || 0), 0)
  const totalPending = thisMonthPayrolls.filter(p => p.payment_status === 'pending').reduce((s, p) => s + (p.total_pay || 0), 0)
  const paidCount = new Set(thisMonthPayrolls.filter(p => p.payment_status === 'paid').map(p => p.employee_id)).size

  const summaryItems = [
    { label: 'Gaji Terbayar', value: totalPaid, isCurrency: true, color: 'green', subLabel: 'Kas keluar bulan ini' },
    { label: 'Gaji Pending', value: totalPending, isCurrency: true, color: 'amber', subLabel: 'Perlu pembayaran' },
    { label: 'Karyawan Digaji', value: `${paidCount} Orang`, color: 'default', subLabel: 'Telah menerima gaji' },
  ]

  // Filtered history
  const filteredPayrolls = useMemo(() => {
    let list = [...payrolls]
    if (filterEmp) list = list.filter(p => p.employee_id === filterEmp)
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number)
      list = list.filter(p => {
        const d = new Date(p.period_date)
        return d.getFullYear() === y && d.getMonth() + 1 === m
      })
    }
    return list
  }, [payrolls, filterEmp, filterMonth])

  if (isEmpError) return <SembakoErrorState error={empError} onRetry={refetchEmp} />
  if (isPayError) return <SembakoErrorState error={payError} onRetry={refetchPay} />

  return (
    <div className="space-y-6">
      {/* Summary */}
      <SembakoSummaryStrip items={summaryItems} />

      {/* Input Gaji */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-widest border-b border-border/40 pb-3">
          Catat Gaji / Rekap Harian Karyawan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pilih Karyawan</label>
            <CustomSelect
              value={empId}
              onChange={handleSelectEmp}
              options={[
                { value: '', label: '— Pilih karyawan —' },
                ...employees.filter(e => e.status === 'aktif').map(e => ({ value: e.id, label: `${e.full_name} (${e.salary_type})` }))
              ]}
              placeholder="— Pilih karyawan —"
            />
          </div>
          <div>
            <label className={labelClass}>Periode / Tanggal</label>
            <DatePicker value={periodDate} onChange={val => setPeriodDate(val)} placeholder="Pilih tanggal" />
          </div>
        </div>

        {selectedEmp && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2"
          >
            {/* Dynamic fields per salary_type */}
            {(selectedEmp.salary_type === 'harian' || selectedEmp.salary_type === 'campuran') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Hari Kerja</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={workDays || ''}
                    onChange={e => setWorkDays(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5">Kalkulasi Gaji Harian</label>
                  <div className="h-10 flex items-center px-3.5 bg-slate-550 dark:bg-white/[0.01] border border-border/40 rounded-xl text-xs font-semibold text-muted-foreground select-none">
                    {workDays} × {formatIDR(selectedEmp.base_salary || 0)}
                  </div>
                </div>
              </div>
            )}

            {selectedEmp.salary_type === 'bulanan' && (
              <div>
                <label className={labelClass}>Gaji Pokok Bulanan (Auto)</label>
                <div className="h-10 flex items-center px-3.5 bg-slate-550 dark:bg-white/[0.01] border border-border/40 rounded-xl text-xs font-black text-foreground">
                  {formatIDR(selectedEmp.base_salary || 0)}
                </div>
              </div>
            )}

            {(selectedEmp.salary_type === 'borongan' || selectedEmp.salary_type === 'campuran') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Jumlah Trip Pengiriman</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={tripCount || ''}
                    onChange={e => setTripCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5">Kalkulasi Borongan Trip</label>
                  <div className="h-10 flex items-center px-3.5 bg-slate-550 dark:bg-white/[0.01] border border-border/40 rounded-xl text-xs font-semibold text-muted-foreground select-none">
                    {tripCount} × {formatIDR(selectedEmp.trip_rate || 0)}
                  </div>
                </div>
              </div>
            )}

            {(selectedEmp.salary_type === 'komisi' || selectedEmp.salary_type === 'campuran') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Total Penjualan Sales</label>
                  <InputRupiah value={salesAmount} onChange={setSalesAmount} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5">Kalkulasi Komisi ({selectedEmp.commission_pct}%)</label>
                  <div className="h-10 flex items-center px-3.5 bg-slate-550 dark:bg-white/[0.01] border border-border/40 rounded-xl text-xs font-black text-emerald-500">
                    {formatIDR(calcComm)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bonus Tambahan</label>
                <InputRupiah value={bonus} onChange={setBonus} />
              </div>
              <div>
                <label className={labelClass}>Potongan Kasbon / Denda</label>
                <InputRupiah value={deduction} onChange={setDeduction} />
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="bg-slate-555 dark:bg-white/[0.01] border border-border/60 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="font-semibold">Base / Gaji Pokok</span>
                <span className="font-bold text-foreground">{formatIDR(calcBase)}</span>
              </div>
              {calcComm > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="font-semibold">Komisi Penjualan</span>
                  <span className="font-bold text-emerald-500">+ {formatIDR(calcComm)}</span>
                </div>
              )}
              {bonus > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="font-semibold">Bonus</span>
                  <span className="font-bold text-emerald-500">+ {formatIDR(bonus)}</span>
                </div>
              )}
              {deduction > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="font-semibold">Potongan</span>
                  <span className="font-bold text-rose-500">- {formatIDR(deduction)}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-2.5 mt-2 flex justify-between items-center">
                <span className="font-black text-foreground">TOTAL DITERIMA</span>
                <span className="font-black text-sm text-foreground">{formatIDR(totalPay)}</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Catatan Slip Gaji</label>
              <textarea
                rows={2}
                className="w-full bg-slate-550 dark:bg-white/[0.02] border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 resize-none font-bold"
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                placeholder="Tulis rincian absen / lembur jika ada..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={recordPayroll.isPending}
              className="w-full h-11 bg-[#0F172A] hover:bg-slate-900 font-bold text-white rounded-xl shadow-lg shadow-slate-950/10 transition-all mt-2 cursor-pointer flex items-center justify-center"
            >
              {recordPayroll.isPending ? 'Menyimpan...' : 'Catat & Simpan Slip Gaji'}
            </button>
          </motion.div>
        )}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          Riwayat Penerimaan Gaji & Slip Payroll
        </h3>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="month"
            className="bg-card border border-border/60 rounded-xl px-3 h-10 text-xs font-bold text-foreground outline-none focus:border-slate-500 cursor-pointer"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          />
          <div className="min-w-[180px]">
            <CustomSelect
              value={filterEmp}
              onChange={setFilterEmp}
              options={[
                { value: '', label: 'Semua Karyawan' },
                ...employees.map(e => ({ value: e.id, label: e.full_name }))
              ]}
              placeholder="Semua Karyawan"
            />
          </div>
        </div>

        {/* Desktop Table */}
        {isDesktop ? (
          <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-slate-50 dark:bg-white/[0.01]">
                    {['Pegawai', 'Periode', 'Tipe Gaji', 'Hari/Trip', 'Base', 'Komisi', 'Bonus', 'Potongan', 'Total Gaji', 'Status', 'Aksi'].map((h, i) => (
                      <th key={i} className="p-3.5 font-black text-[10px] text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredPayrolls.map(p => {
                    const isPending = p.payment_status === 'pending'
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{p.sembako_employees?.full_name || '-'}</td>
                        <td className="p-3.5 text-muted-foreground font-semibold">{fmtDate(p.period_date)}</td>
                        <td className="p-3.5 text-muted-foreground font-semibold capitalize">{p.period_type}</td>
                        <td className="p-3.5 text-foreground font-bold">{p.work_days || p.trip_count || '—'}</td>
                        <td className="p-3.5 text-foreground font-semibold">{formatIDR(p.base_amount)}</td>
                        <td className="p-3.5 text-foreground font-semibold">{p.commission_amount ? formatIDR(p.commission_amount) : '—'}</td>
                        <td className="p-3.5 text-emerald-500 font-bold">{p.bonus ? `+${formatIDR(p.bonus)}` : '—'}</td>
                        <td className="p-3.5 text-rose-500 font-bold">{p.deduction ? `-${formatIDR(p.deduction)}` : '—'}</td>
                        <td className="p-3.5 text-foreground font-black">{formatIDR(p.total_pay)}</td>
                        <td className="p-3.5">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                            isPending
                              ? "bg-[#0F172A]/10 text-amber-400 border-[#0F172A]/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}>
                            {isPending ? 'Pending' : 'Lunas'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isPending && (
                            <button
                              onClick={() => markPaid.mutate(p.id)}
                              className="px-3 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Check size={12} />
                              <span>Lunas</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {filteredPayrolls.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground italic font-semibold">
                        Tidak ada riwayat slip gaji ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Mobile cards */
          <div className="space-y-3">
            {filteredPayrolls.map(p => {
              const isPending = p.payment_status === 'pending'
              return (
                <div key={p.id} className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-foreground truncate">{p.sembako_employees?.full_name || '-'}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {fmtDate(p.period_date)} · <span className="capitalize">{p.period_type}</span>
                      </p>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0",
                      isPending
                        ? "bg-[#0F172A]/10 text-amber-400 border-[#0F172A]/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>
                      {isPending ? 'Pending' : 'Lunas'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-border/40">
                    <span className="text-sm font-black text-foreground">{formatIDR(p.total_pay)}</span>
                    {isPending && (
                      <button
                        onClick={() => markPaid.mutate(p.id)}
                        className="px-4 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Tandai Lunas</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredPayrolls.length === 0 && (
              <div className="bg-card border border-border/60 rounded-2xl p-8 text-center text-muted-foreground">
                <DollarSign size={32} className="mx-auto mb-2 opacity-30 text-[#0F172A]" />
                <p className="text-xs font-bold text-foreground">Belum ada data payroll</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
