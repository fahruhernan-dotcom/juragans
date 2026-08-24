import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Hook untuk mengelola riwayat notifikasi in-app dan realtime subscription
 */
export function useNotifications() {
  const { user, tenant } = useAuth()
  const queryClient = useQueryClient()
  const tenantId = tenant?.id
  const userId = user?.id

  // 1. Fetch Daftar Notifikasi
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', tenantId, userId],
    queryFn: async () => {
      if (!tenantId || !userId) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      return data || []
    },
    enabled: Boolean(tenantId && userId),
    staleTime: 1000 * 30, // 30 detik
  })

  // 2. Realtime Listener: Langsung update saat ada notifikasi baru masuk
  useEffect(() => {
    if (!tenantId || !userId) return

    const channelId = `notifications-realtime-${userId}-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] })
        }
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [tenantId, userId, queryClient])

  // 3. Mutation: Tandai 1 Notifikasi Terbaca
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      if (!notificationId) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] })
    },
  })

  // 4. Mutation: Tandai Semua Notifikasi Terbaca
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !userId) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] })
    },
  })

  // 5. Mutation: Hapus 1 Notifikasi
  const deleteNotifMutation = useMutation({
    mutationFn: async (notificationId) => {
      if (!notificationId) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] })
    },
  })

  // 6. Mutation: Hapus Semua Notifikasi Tenant/User
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) return

      let query = supabase.from('notifications').delete()
      if (userId) {
        query = query.or(`tenant_id.eq.${tenantId},user_id.eq.${userId}`)
      } else {
        query = query.eq('tenant_id', tenantId)
      }

      const { error } = await query
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications', tenantId, userId], [])
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] })
    },
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotif: deleteNotifMutation.mutate,
    clearAllNotifications: clearAllNotificationsMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending,
    isDeleting: deleteNotifMutation.isPending || clearAllNotificationsMutation.isPending,
  }
}

/**
 * Hook untuk preferensi notifikasi user
 */
export function useNotificationPreferences() {
  const { user, tenant } = useAuth()
  const queryClient = useQueryClient()
  const tenantId = tenant?.id
  const userId = user?.id

  const {
    data: preferences,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notification_preferences', tenantId, userId],
    queryFn: async () => {
      if (!tenantId || !userId) return null

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      // Jika belum ada record preferensi, return default
      return data || {
        notify_new_sale: true,
        notify_payment_received: true,
        notify_sale_status_changed: true,
        notify_low_stock: true,
        notify_delivery: true,
        notify_system_alert: true,
      }
    },
    enabled: Boolean(tenantId && userId),
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs) => {
      if (!tenantId || !userId) return

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            tenant_id: tenantId,
            user_id: userId,
            ...newPrefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,user_id' }
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_preferences', tenantId, userId] })
    },
  })

  return {
    preferences: preferences || {
      notify_new_sale: true,
      notify_payment_received: true,
      notify_sale_status_changed: true,
      notify_low_stock: true,
      notify_delivery: true,
      notify_system_alert: true,
    },
    isLoading,
    refetch,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  }
}
