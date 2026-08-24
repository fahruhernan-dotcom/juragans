import React, { useState, useEffect } from 'react'
import { syncEngine, SyncStatus } from '@/lib/offline/syncEngine'
import { db } from '@/lib/offline/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function SyncStatusBadge({ className }) {
  const [status, setStatus] = useState(syncEngine.status)
  const pendingCount = useLiveQuery(() => db.sync_queue.count(), [], 0)

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(newStatus => setStatus(newStatus))
    return unsubscribe
  }, [])

  if (status === SyncStatus.SYNCING) {
    return (
      <Badge className={cn("bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse", className)}>
        <RefreshCw size={12} className="animate-spin text-amber-400" />
        <span>MENGUNGGAH SINKRONISASI...</span>
      </Badge>
    )
  }

  if (status === SyncStatus.OFFLINE || !navigator.onLine) {
    return (
      <Badge className={cn("bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5", className)}>
        <WifiOff size={12} className="text-rose-400" />
        <span>OFFLINE MODE {pendingCount > 0 ? `(${pendingCount} PENDING)` : ''}</span>
      </Badge>
    )
  }

  return (
    <Badge className={cn("bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5", className)}>
      <Wifi size={12} className="text-emerald-400" />
      <span>ONLINE & SYNCED</span>
    </Badge>
  )
}
