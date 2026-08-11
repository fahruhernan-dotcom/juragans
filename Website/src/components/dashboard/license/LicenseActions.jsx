import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Zap, Layers, Crown, Loader2, RotateCcw, CalendarDays } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { ShieldAlert } from 'lucide-react'
import { formatLicenseDate } from '@/lib/license/licenseActions'
import { cn } from '@/lib/utils'

export function LicenseActions({
  updating,
  customDateInput,
  setCustomDateInput,
  prepareLicenseUpdate,
  showConfirm,
  setShowConfirm,
  pendingAction,
  pendingExpiry,
  executeLicenseUpdate
}) {
  const [confirmInput, setConfirmInput] = useState('');
  return (
    <>
      <div className="space-y-5">
        {/* ── Section: Perpanjang ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
            Perpanjang Masa Aktif
          </p>
          <p className="text-[11px] text-muted-foreground">
            Perpanjang dari tanggal expired saat ini. Cocok untuk client yang masih aktif.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Monthly */}
            <Button
              onClick={() => prepareLicenseUpdate('monthly')}
              disabled={updating}
              variant="outline"
              className="h-14 rounded-xl justify-start gap-3 px-4 text-left hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 group"
            >
              {updating ? <Loader2 size={15} className="animate-spin shrink-0" /> : (
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 shrink-0">
                  <Zap size={13} className="text-amber-500" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">Perpanjang 1 Bulan</p>
                <p className="text-[10px] text-muted-foreground font-medium">Jatuh tempo tgl 28 berikutnya</p>
              </div>
            </Button>

            {/* Yearly */}
            <Button
              onClick={() => prepareLicenseUpdate('yearly')}
              disabled={updating}
              variant="outline"
              className="h-14 rounded-xl justify-start gap-3 px-4 text-left hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 group"
            >
              {updating ? <Loader2 size={15} className="animate-spin shrink-0" /> : (
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shrink-0">
                  <Layers size={13} className="text-blue-500" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">Perpanjang 1 Tahun</p>
                <p className="text-[10px] text-muted-foreground font-medium">Siklus tahunan tanggal 28</p>
              </div>
            </Button>

            {/* Permanent */}
            <Button
              onClick={() => prepareLicenseUpdate('permanent')}
              disabled={updating}
              variant="outline"
              className="h-14 rounded-xl justify-start gap-3 px-4 text-left hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 group"
            >
              {updating ? <Loader2 size={15} className="animate-spin shrink-0" /> : (
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 shrink-0">
                  <Crown size={13} className="text-violet-500 animate-pulse" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">Lisensi Permanen</p>
                <p className="text-[10px] text-muted-foreground font-medium">Masa aktif tanpa batas</p>
              </div>
            </Button>

            {/* Custom Date */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  title="Pilih tanggal kedaluwarsa kustom"
                  className={cn(
                    'w-full h-14 border border-input rounded-xl text-xs font-bold pl-9 pr-3',
                    'bg-background text-foreground',
                    'focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent',
                    '[color-scheme:light] dark:[color-scheme:dark]'
                  )}
                />
              </div>
              <Button
                onClick={() => prepareLicenseUpdate('custom')}
                disabled={updating || !customDateInput}
                className="h-14 rounded-xl text-xs font-black uppercase tracking-wider px-5 shrink-0 disabled:opacity-40"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : 'Set'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Section: Reset ─────────────────────────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60" />
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <RotateCcw size={11} />
              Reset dari Hari Ini
            </p>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 space-y-3">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
              ⚠️ Reset menghitung ulang dari <strong>hari ini</strong>, mengabaikan sisa hari yang ada. Gunakan untuk koreksi masa aktif yang salah.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => prepareLicenseUpdate('reset_30')}
                disabled={updating}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl text-xs font-bold gap-1.5 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <RotateCcw size={11} />
                30 Hari
              </Button>
              <Button
                onClick={() => prepareLicenseUpdate('reset_365')}
                disabled={updating}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl text-xs font-bold gap-1.5 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <RotateCcw size={11} />
                365 Hari
              </Button>
              <Button
                onClick={() => prepareLicenseUpdate('reset_999')}
                disabled={updating}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl text-xs font-bold gap-1.5 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <RotateCcw size={11} />
                999 Hari
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Confirm Dialog ─────────────────────────────────────────────────────── */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-500" />
              Konfirmasi Perubahan Lisensi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed mt-1">
              {pendingAction === 'permanent' ? (
                <>Apakah Anda yakin ingin menyetel lisensi menjadi <span className="text-violet-500 dark:text-violet-400 font-bold">Permanen (Unlimited)</span>?</>
              ) : (
                <>Apakah Anda yakin ingin memperbarui lisensi server bisnis ini sampai <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pendingExpiry ? formatLicenseDate(pendingExpiry) : ''}</span>?</>
              )}
              {['reset_30', 'reset_365', 'reset_999'].includes(pendingAction) && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  ⚠️ Sisa hari sebelumnya akan diabaikan dan dihitung ulang dari hari ini.
                </span>
              )}
              {/* Double‑confirm input */}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Ketik <strong>KONFIRMASI</strong> untuk melanjutkan:</p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-10 text-xs font-semibold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeLicenseUpdate}
              disabled={confirmInput !== 'KONFIRMASI'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-bold flex-1 border-none"
            >
              Ya, Perbarui Lisensi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
