import React, { useState, useEffect } from 'react'
import { Bell, ShoppingCart, Clock, Package, Moon, Server, Check, Sparkles, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { T } from '../constants'
import { Section, SectionLabel } from './Primitives'

export function NotificationPreferencesCard({ tenantId, userId, accent }) {
  const [loading, setLoading] = useState(true)
  const [testingNotif, setTestingNotif] = useState(false)
  const [prefs, setPrefs] = useState({
    notify_new_sale: true,
    notify_receivables: true,
    notify_low_stock: true,
    notify_daily_digest: true,
    notify_server_billing: true,
  })

  // 1. Fetch preferensi user dari Supabase
  useEffect(() => {
    if (!tenantId || !userId) return

    const loadPrefs = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('user_id', userId)
          .maybeSingle()

        if (!error && data) {
          setPrefs({
            notify_new_sale: data.notify_new_sale ?? true,
            notify_receivables: data.notify_receivables ?? true,
            notify_low_stock: data.notify_low_stock ?? true,
            notify_daily_digest: data.notify_daily_digest ?? true,
            notify_server_billing: data.notify_server_billing ?? true,
          })
        }
      } catch (err) {
        console.error('[NotificationPreferences] Error loading:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPrefs()
  }, [tenantId, userId])

  // 2. Toggle Handler dengan Optimistic Update & Upsert
  const handleToggle = async (key) => {
    if (!tenantId || !userId) return

    const newVal = !prefs[key]
    setPrefs((prev) => ({ ...prev, [key]: newVal }))

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            tenant_id: tenantId,
            user_id: userId,
            ...prefs,
            [key]: newVal,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,user_id' }
        )

      if (error) {
        throw error
      }
      toast.success('Pengaturan notifikasi diperbarui', { duration: 1500 })
    } catch (err) {
      console.error('[NotificationPreferences] Error saving:', err)
      // Revert optimistic update on failure
      setPrefs((prev) => ({ ...prev, [key]: !newVal }))
      toast.error('Gagal menyimpan preferensi notifikasi')
    }
  }

  // 3. Tes Kirim Notifikasi Langsung ke HP
  const handleTestNotification = async () => {
    if (!tenantId || testingNotif) return
    setTestingNotif(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          tenant_id: tenantId,
          recipient_user_ids: [userId],
          title: '🔔 Tes Push Notifikasi HP',
          body: 'Notifikasi Android Dashboard ERP berfungsi 100% normal!',
          data: { route: '/akun' }
        }
      })

      if (error) throw error
      toast.success('Notifikasi tes berhasil dikirim ke HP Anda! 📲', { duration: 3000 })
    } catch (err) {
      console.error('[Test Notification Error]:', err)
      // Fallback via database notification dispatch
      try {
        await supabase.rpc('dispatch_tenant_notification', {
          p_tenant_id: tenantId,
          p_type: 'SYSTEM_ALERT',
          p_title: '🔔 Tes Notifikasi ERP',
          p_body: 'Notifikasi sistem Android Dashboard ERP berhasil terhubung!',
          p_data: { route: '/akun' }
        })
        toast.success('Notifikasi tes dikirim via database dispatcher! 🔔')
      } catch (dbErr) {
        toast.error('Gagal mengirim notifikasi tes')
      }
    } finally {
      setTestingNotif(false)
    }
  }

  const items = [
    {
      key: 'notify_new_sale',
      label: 'Transaksi Penjualan Baru',
      desc: 'Notifikasi realtime saat kasir mencatat nota atau pesanan baru',
      icon: ShoppingCart,
      color: '#10B981',
    },
    {
      key: 'notify_receivables',
      label: 'Piutang Jatuh Tempo & Overdue',
      desc: 'Pengingat H-1, Hari H, dan keterlambatan piutang pelanggan (Jam 12:00 WIB)',
      icon: Clock,
      color: '#F59E0B',
    },
    {
      key: 'notify_low_stock',
      label: 'Stok Menipis & Kadaluwarsa',
      desc: 'Peringatan stok gudang minimum & batch mendekati expired (Jam 07:30 WIB)',
      icon: Package,
      color: '#EC4899',
    },
    {
      key: 'notify_daily_digest',
      label: 'Rekap Tutup Toko Malam',
      desc: 'Rangkuman total omzet harian, kas masuk, dan laba (Jam 20:00 WIB)',
      icon: Moon,
      color: '#6366F1',
    },
    {
      key: 'notify_server_billing',
      label: 'Tagihan Server Developer',
      desc: 'Pengingat perpanjangan server H-7 sebelum tanggal 28 setiap bulan',
      icon: Server,
      color: '#8B5CF6',
    },
  ]

  return (
    <Section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionLabel icon={Bell} text="Preferensi Notifikasi Android" />
        <button
          onClick={handleTestNotification}
          disabled={testingNotif}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            fontSize: 11,
            fontWeight: 700,
            cursor: testingNotif ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.2s',
          }}
          className="hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send size={11} />
          {testingNotif ? 'Mengirim...' : 'Tes Notif HP'}
        </button>
      </div>

      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.hairline}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {items.map((item, idx) => {
          const IconComp = item.icon
          const isActive = prefs[item.key]
          const isLast = idx === items.length - 1

          return (
            <div
              key={item.key}
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: isLast ? 'none' : `1px solid ${T.hairline}`,
                background: isActive ? 'transparent' : 'rgba(0,0,0,0.1)',
                transition: 'background 0.2s',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${item.color}18`,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconComp size={18} />
              </div>

              {/* Label & Desc */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isActive ? T.text : T.textMute,
                    letterSpacing: -0.2,
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.textDim,
                    lineHeight: 1.35,
                  }}
                >
                  {item.desc}
                </div>
              </div>

              {/* iOS / Modern Switch Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => handleToggle(item.key)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 999,
                  background: isActive ? (accent?.base || '#10B981') : 'rgba(255,255,255,0.12)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: 2,
                  flexShrink: 0,
                  transition: 'background-color 200ms ease',
                  boxShadow: isActive ? `0 2px 8px ${accent?.base || '#10B981'}44` : 'none',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: '#FFFFFF',
                    transform: isActive ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
