import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '@/lib/supabase'

let isInitialized = false

/**
 * Inisialisasi Push Notifications pada Android / iOS secara aman (crash-proof)
 * @param {Object} params
 * @param {string} params.tenantId - ID Tenant aktif
 * @param {string} params.userId - ID User terautentikasi
 * @param {Function} [params.onNavigate] - Callback navigasi deep link (opsional)
 */
export async function initPushNotifications({ tenantId, userId, onNavigate }) {
  if (!Capacitor.isNativePlatform()) {
    // Pada browser web biasa, Push Notifications native dilewati
    return { supported: false, reason: 'web_environment' }
  }

  if (isInitialized) {
    return { supported: true, initialized: true }
  }

  try {
    // 1. Periksa dan minta izin notifikasi OS
    let permStatus
    try {
      permStatus = await PushNotifications.checkPermissions()
      if (permStatus?.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }
    } catch (permErr) {
      console.warn('[PushNotification] Error checking/requesting permissions:', permErr)
      return { supported: true, granted: false, reason: 'permission_check_failed' }
    }

    if (permStatus?.receive !== 'granted') {
      return { supported: true, granted: false, reason: 'permission_denied' }
    }

    // 2. Buat Notification Channels untuk Android (High Priority Heads-up & Lockscreen)
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'erp_main_channel',
          name: 'Transaksi & Notifikasi Bisnis',
          description: 'Notifikasi pesanan baru, pembayaran masuk, piutang, dan stok',
          importance: 5, // High priority (heads-up popup & lockscreen)
          visibility: 1, // VISIBILITY_PUBLIC (Muncul di layar terkunci)
          vibration: true,
          lights: true,
          lightColor: '#10B981',
        })
      } catch (channelErr) {
        console.warn('[PushNotification] Error createChannel (non-fatal):', channelErr)
      }
    }

    // 3. Listener: Sukses mendapatkan token FCM
    try {
      await PushNotifications.addListener('registration', async (token) => {
        if (!token?.value || !tenantId || !userId) return
        console.log('[PushNotification] FCM Token Berhasil Diperoleh:', token.value.slice(0, 15) + '...')

        try {
          // Coba panggil helper function atomic upsert di Supabase
          const { error: rpcErr } = await supabase.rpc('register_device_token', {
            p_tenant_id: tenantId,
            p_device_token: token.value,
            p_platform: Capacitor.getPlatform() || 'android',
            p_device_name: navigator?.userAgent?.slice(0, 100) || 'Android Device',
          })

          if (rpcErr) {
            console.warn('[PushNotification] RPC register_device_token gagal, mencoba direct table upsert:', rpcErr.message)
            // Fallback langsung ke tabel device_tokens
            const { error: tableErr } = await supabase.from('device_tokens').upsert({
              tenant_id: tenantId,
              user_id: userId,
              device_token: token.value,
              platform: Capacitor.getPlatform() || 'android',
              device_name: navigator?.userAgent?.slice(0, 100) || 'Android Device',
              is_active: true,
              last_seen: new Date().toISOString()
            }, { onConflict: 'device_token' })

            if (tableErr) {
              console.error('[PushNotification] Direct upsert device_tokens gagal:', tableErr)
            } else {
              console.log('[PushNotification] Device token tersimpan via direct table upsert')
            }
          } else {
            console.log('[PushNotification] Device token tersimpan via RPC')
          }
        } catch (err) {
          console.error('[PushNotification] Gagal menyimpan token ke Supabase:', err)
        }
      })
    } catch (listenerErr) {
      console.warn('[PushNotification] Error adding registration listener:', listenerErr)
    }

    // 4. Listener: Error registrasi
    try {
      await PushNotifications.addListener('registrationError', (error) => {
        console.warn('[PushNotification] Registration error (non-fatal):', error)
      })
    } catch (err) {
      console.warn('[PushNotification] Error adding registrationError listener:', err)
    }

    // 5. Listener: Notifikasi diterima saat aplikasi aktif di foreground
    try {
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        window.dispatchEvent(new CustomEvent('app:push-received', { detail: notification }))
      })
    } catch (err) {
      console.warn('[PushNotification] Error adding pushNotificationReceived listener:', err)
    }

    // 6. Listener: User tap notifikasi dari status bar Android
    try {
      await PushNotifications.addListener('pushNotificationActionPerformed', (notificationAction) => {
        const data = notificationAction?.notification?.data
        const targetRoute = data?.route || data?.url

        if (targetRoute) {
          if (typeof onNavigate === 'function') {
            onNavigate(targetRoute)
          } else {
            window.location.href = targetRoute
          }
        }
      })
    } catch (err) {
      console.warn('[PushNotification] Error adding pushNotificationActionPerformed listener:', err)
    }

    // 7. Daftarkan perangkat ke FCM
    try {
      await PushNotifications.register()
    } catch (regErr) {
      console.warn('[PushNotification] PushNotifications.register warning (non-fatal):', regErr)
    }

    isInitialized = true
    return { supported: true, granted: true }
  } catch (error) {
    console.warn('[PushNotification] Inisialisasi push notification ditangani dengan aman:', error)
    return { supported: true, error: error?.message || 'init_failed' }
  }
}
