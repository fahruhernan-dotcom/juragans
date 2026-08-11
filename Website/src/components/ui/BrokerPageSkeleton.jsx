// =============================================================
// TernakOS — Broker Page Skeleton Loading Components
// Reusable skeletons matching each page's layout.
// Usage: if (isLoading) return <XxxPageSkeleton />
// =============================================================

import { Skeleton } from '@/components/ui/skeleton'

const BASE = "bg-[#06090F] min-h-screen p-4 md:p-6 lg:p-8"

// ── Reusable atoms ────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-3 w-16 rounded-full" />
    </div>
  )
}

function SkeletonListCard() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-3 w-32 rounded-full flex-1" />
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

function SkeletonPageHeader({ withSearch = true, withButton = true }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-xl" />
        <Skeleton className="h-4 w-36 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        {withSearch && <Skeleton className="h-10 w-40 rounded-xl" />}
        {withButton && <Skeleton className="h-10 w-28 rounded-xl" />}
      </div>
    </div>
  )
}

function SkeletonTabs({ count = 3 }) {
  return (
    <div className="flex gap-2 mb-4">
      {Array(count).fill(0).map((_, i) => (
        <Skeleton key={i} className={`h-9 rounded-xl ${i === 0 ? 'w-24' : 'w-20'}`} />
      ))}
    </div>
  )
}

// ── Page-level skeletons ──────────────────────────────────────

/** Beranda / Dashboard */
export function BerandaSkeleton() {
  return (
    <div className={BASE + " space-y-6"}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-40 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="col-span-1 lg:col-span-2 h-64 rounded-2xl" />
        <Skeleton className="col-span-1 h-64 rounded-2xl" />
      </div>
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => <SkeletonListCard key={i} />)}
      </div>
    </div>
  )
}

/** Transaksi — tabs + summary strip + transaction cards */
export function TransaksiSkeleton() {
  return (
    <div className={BASE + " space-y-4"}>
      <SkeletonPageHeader />
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {Array(3).fill(0).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <SkeletonTabs count={4} />
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Pengiriman — stat cards + tabs + delivery cards */
export function PengirimanSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-xl" />
        <Skeleton className="h-4 w-44 rounded-full" />
      </div>
      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <SkeletonTabs count={2} />
      <div className="flex gap-2 mb-3">
        {['Semua', 'Aktif', 'Selesai'].map(l => (
          <Skeleton key={l} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
            <div className="flex justify-between">
              <div className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array(4).fill(0).map((_, j) => <Skeleton key={j} className="h-3 rounded-full" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** RPA & Piutang — search + list of RPA cards */
export function RPASkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <SkeletonPageHeader withSearch />
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="space-y-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-48 rounded-full" />
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-4 w-24 rounded-full ml-auto" />
              <Skeleton className="h-6 w-20 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Kandang — search + farm list */
export function KandangSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <SkeletonPageHeader withSearch />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
            <div className="space-y-1.5 text-right">
              <Skeleton className="h-3 w-16 rounded-full ml-auto" />
              <Skeleton className="h-3 w-12 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Tim & Akses — member cards + invite */
export function TimSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <SkeletonPageHeader withSearch={false} withButton />
      {/* Tenant info card */}
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Armada — vehicles + drivers tabs */
export function ArmadaSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <SkeletonPageHeader withSearch />
      <SkeletonTabs count={2} />
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** CashFlow — period tabs + chart + table */
export function CashFlowSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <SkeletonPageHeader withSearch={false} withButton={false} />
      {/* Period tabs */}
      <SkeletonTabs count={5} />
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      {/* Chart placeholder */}
      <Skeleton className="h-56 w-full rounded-2xl" />
      {/* Table rows */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-1">
        {Array(8).fill(0).map((_, i) => <SkeletonTableRow key={i} />)}
      </div>
    </div>
  )
}

/** RPADetail — detail header + transaction list */
export function RPADetailSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      {/* Back + header */}
      <Skeleton className="h-9 w-24 rounded-xl" />
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {Array(3).fill(0).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      </div>
      <SkeletonTabs count={3} />
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => <SkeletonListCard key={i} />)}
      </div>
    </div>
  )
}

/** Generic fallback for any page */
export function GenericPageSkeleton() {
  return (
    <div className={BASE + " space-y-5"}>
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => <SkeletonListCard key={i} />)}
      </div>
    </div>
  )
}
