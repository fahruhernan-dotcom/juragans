import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Users, Plus, UserPlus, Lock, Pencil, Trash2, Phone, Loader2, Search } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { isSuperadmin } from '@/lib/auth'
import { isOwner } from '@/lib/auth/business-roles'
import { BrokerMobileHeader } from './BrokerMobileHeader'
import {
  useBrokerEmployees,
  useCreateBrokerEmployee,
  useUpdateBrokerEmployee,
  useDeleteBrokerEmployee,
} from '@/lib/hooks/useBrokerKaryawanData'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

const SALARY_TYPES = [
  { value: 'harian',   label: 'Harian' },
  { value: 'bulanan',  label: 'Bulanan' },
  { value: 'borongan', label: 'Borongan' },
  { value: 'komisi',   label: 'Komisi' },
  { value: 'campuran', label: 'Campuran' },
]

const STATUS_CONFIG = {
  aktif:    { label: 'Aktif',    bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  nonaktif: { label: 'Non-aktif', bg: 'bg-red-500/10',     text: 'text-red-400',    border: 'border-red-500/20' },
  cuti:     { label: 'Cuti',     bg: 'bg-amber-500/10',   text: 'text-amber-400',  border: 'border-amber-500/20' },
}

const EMPTY_FORM = {
  full_name: '', role: '', phone: '', salary_type: 'bulanan',
  salary_amount: '', status: 'aktif', start_date: null, notes: '',
}

export default function BrokerKaryawanPage({ hideMobileHeader = false, accentColor = '#0EA5E9', roles = [] }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen } = useOutletContext() || {}
  const { tenant, profile } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isOwnerUser = isOwner(profile) || isSuperadmin(profile)
  const isStarter = sub.plan === 'starter' && sub.status !== 'trial'

  const { data: employees = [], isLoading } = useBrokerEmployees()
  const createEmployee = useCreateBrokerEmployee()
  const updateEmployee = useUpdateBrokerEmployee()
  const deleteEmployee = useDeleteBrokerEmployee()

  const [sheet, setSheet] = useState({ open: false, employee: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')

  const openAdd = () => { setForm(EMPTY_FORM); setSheet({ open: true, employee: null }) }
  const openEdit = (emp) => {
    setForm({
      full_name: emp.full_name, role: emp.role, phone: emp.phone || '',
      salary_type: emp.salary_type, salary_amount: emp.salary_amount || '',
      status: emp.status, start_date: emp.start_date || null, notes: emp.notes || '',
    })
    setSheet({ open: true, employee: emp })
  }

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search || e.full_name?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'semua' || e.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [employees, search, statusFilter])

  const stats = useMemo(() => ({
    aktif:    employees.filter(e => e.status === 'aktif').length,
    nonaktif: employees.filter(e => e.status === 'nonaktif').length,
    cuti:     employees.filter(e => e.status === 'cuti').length,
  }), [employees])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      salary_amount: Number(form.salary_amount) || 0,
      start_date: form.start_date || null,
    }
    if (sheet.employee) {
      updateEmployee.mutate({ id: sheet.employee.id, ...payload }, {
        onSuccess: () => setSheet({ open: false, employee: null })
      })
    } else {
      createEmployee.mutate(payload, {
        onSuccess: () => setSheet({ open: false, employee: null })
      })
    }
  }

  const isSaving = createEmployee.isPending || updateEmployee.isPending

  if (isStarter) {
    return (
      <div className="bg-[#06090F] min-h-screen">
        {(!isDesktop && !hideMobileHeader) && (
          <BrokerMobileHeader title="Karyawan" onMenuClick={() => setSidebarOpen?.(true)} />
        )}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}33` }}>
            <Lock size={28} style={{ color: accentColor }} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
              <Users size={11} style={{ color: accentColor }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Fitur Pro</span>
            </div>
            <h2 className="font-display font-black text-xl text-white mb-2">Karyawan & Manajemen SDM</h2>
            <p className="text-sm max-w-xs leading-relaxed text-[#64748B]">
              Kelola data karyawan, jabatan, gaji, dan status tersedia di plan{' '}
              <span className="text-white font-bold">Pro</span> dan <span className="text-white font-bold">Business</span>.
            </p>
          </div>
          <Link to="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-colors"
            style={{ background: accentColor, boxShadow: `0 4px 20px ${accentColor}44` }}>
            Lihat Paket Pro →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#06090F] min-h-screen pb-24">
      {(!isDesktop && !hideMobileHeader) && (
        <BrokerMobileHeader title="Karyawan" onMenuClick={() => setSidebarOpen?.(true)} />
      )}

      <div className={cn('space-y-5', isDesktop ? 'p-8 max-w-5xl mx-auto' : 'px-4 pt-4')}>

        {/* Desktop header */}
        {isDesktop && (
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[28px] font-black text-white leading-tight">Karyawan</h1>
              <p className="text-[#64748B] text-sm mt-1">{employees.length} karyawan terdaftar</p>
            </div>
            {isOwnerUser && (
              <button onClick={openAdd}
                className="h-11 px-5 rounded-xl font-black text-sm text-white flex items-center gap-2 transition-all active:scale-95"
                style={{ background: accentColor, boxShadow: `0 4px 16px ${accentColor}40` }}>
                <UserPlus size={16} /> Tambah Karyawan
              </button>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'aktif', label: 'Aktif', color: '#021a02' },
            { key: 'nonaktif', label: 'Non-aktif', color: '#F87171' },
            { key: 'cuti', label: 'Cuti', color: '#F59E0B' },
          ].map(s => (
            <div key={s.key} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-xl font-black" style={{ color: s.color }}>{stats[s.key]}</div>
              <div className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <Input
            placeholder="Cari karyawan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.03] border-white/5 text-white placeholder:text-[#4B6478] h-10"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['semua', 'aktif', 'nonaktif', 'cuti'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide shrink-0 transition-all',
                statusFilter === s ? 'text-white' : 'text-[#4B6478] bg-white/[0.03] hover:text-white/60'
              )}
              style={statusFilter === s ? { background: accentColor } : {}}>
              {s === 'semua' ? 'Semua' : STATUS_CONFIG[s]?.label}
              {s !== 'semua' && <span className="ml-1 opacity-70">({stats[s] ?? 0})</span>}
            </button>
          ))}
        </div>

        {/* Mobile add button */}
        {!isDesktop && isOwnerUser && (
          <button onClick={openAdd}
            className="w-full h-11 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: accentColor }}>
            <Plus size={16} /> Tambah Karyawan
          </button>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/[0.03]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
              <Users size={20} className="text-[#4B6478]" />
            </div>
            <p className="text-[13px] font-black text-white/40 uppercase tracking-wide">
              {search || statusFilter !== 'semua' ? 'Tidak ada hasil' : 'Belum ada karyawan'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(emp => {
              const status = STATUS_CONFIG[emp.status] || STATUS_CONFIG.aktif
              return (
                <div key={emp.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: `${accentColor}30`, border: `1px solid ${accentColor}40` }}>
                    {emp.full_name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-[13px] font-black text-white leading-tight">{emp.full_name}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={cn('text-[9px] font-black border', status.bg, status.text, status.border)}>
                          {status.label}
                        </Badge>
                        {isOwnerUser && (
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(emp)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4B6478] hover:text-white transition-colors bg-white/[0.03]">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => setDeleteTarget(emp)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4B6478] hover:text-red-400 transition-colors bg-white/[0.03]">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {emp.role && (
                        <span className="text-[10px] font-bold text-[#4B6478] capitalize">{emp.role}</span>
                      )}
                      {emp.phone && (
                        <a href={`tel:${emp.phone}`} className="text-[10px] font-bold text-[#4B6478] flex items-center gap-1 hover:text-white transition-colors">
                          <Phone size={9} />{emp.phone}
                        </a>
                      )}
                      {emp.salary_amount > 0 && (
                        <span className="text-[10px] font-bold text-[#4B6478]">
                          {formatIDR(emp.salary_amount)}/{SALARY_TYPES.find(t => t.value === emp.salary_type)?.label?.toLowerCase() || emp.salary_type}
                        </span>
                      )}
                      {emp.start_date && (
                        <span className="text-[10px] font-bold text-[#4B6478]">
                          Mulai {formatDate(emp.start_date, 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheet.open} onOpenChange={open => setSheet(s => ({ ...s, open }))}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/5 rounded-t-[28px] max-h-[92vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-white font-black text-lg">
              {sheet.employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
            </SheetTitle>
            <SheetDescription className="text-[#4B6478] text-xs">
              {sheet.employee ? 'Perbarui data karyawan' : 'Isi data karyawan baru'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pb-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Nama Lengkap *</Label>
              <Input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nama karyawan"
                className="bg-[#111C24] border-white/5 text-white h-11" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Jabatan *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-[#111C24] border-white/5 text-white text-sm font-medium">
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border-white/10 text-white">
                    {roles.map(r => (
                      <SelectItem key={r} value={r} className="capitalize cursor-pointer">
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                    <SelectItem value="lainnya" className="cursor-pointer">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-[#111C24] border-white/5 text-white text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border-white/10 text-white">
                    <SelectItem value="aktif" className="cursor-pointer">Aktif</SelectItem>
                    <SelectItem value="nonaktif" className="cursor-pointer">Non-aktif</SelectItem>
                    <SelectItem value="cuti" className="cursor-pointer">Cuti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">No. HP</Label>
              <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))}
                className="bg-[#111C24] border-white/5 text-white h-11" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Tipe Gaji</Label>
                <Select value={form.salary_type} onValueChange={v => setForm(f => ({ ...f, salary_type: v }))}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-[#111C24] border-white/5 text-white text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border-white/10 text-white">
                    {SALARY_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Nominal Gaji</Label>
                <InputRupiah value={form.salary_amount} onChange={v => setForm(f => ({ ...f, salary_amount: v }))}
                  className="bg-[#111C24] border-white/5 text-white h-11" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Tanggal Mulai</Label>
              <DatePicker value={form.start_date} onChange={d => setForm(f => ({ ...f, start_date: d }))}
                className="bg-[#111C24] border-white/5 text-white h-11 w-full" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Catatan</Label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                className="w-full rounded-lg bg-[#111C24] border border-white/5 text-white text-sm px-3 py-2.5 resize-none placeholder:text-[#4B6478]" />
            </div>

            <Button type="submit" disabled={isSaving}
              className="w-full h-12 font-black text-sm text-white rounded-xl border-none"
              style={{ background: accentColor }}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : sheet.employee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0C1319] border-white/5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Hapus Karyawan?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478]">
              <strong className="text-white">{deleteTarget?.full_name}</strong> akan dihapus dari daftar karyawan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white font-black"
              onClick={() => { deleteEmployee.mutate(deleteTarget.id); setDeleteTarget(null) }}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
