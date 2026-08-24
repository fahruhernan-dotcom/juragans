import { QueryClient } from '@tanstack/react-query'
import { normalizeSupabaseError } from './supabaseErrorHandler'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           1000 * 60 * 5,  // data fresh 5 menit — tidak refetch saat navigasi
      gcTime:              1000 * 60 * 60 * 24, // cache tetap di memory 24 jam setelah tidak dipakai
      refetchOnWindowFocus: false,          // jangan refetch saat user alt-tab / klik window
      refetchOnMount:      false,          // gunakan cache langsung; hanya refetch jika cache kosong / stale
      refetchOnReconnect:  false,          // jangan refetch otomatis saat internet reconnect
      placeholderData:     (previousData) => previousData, // pertahankan data lama saat background sync (tanpa layout shift)
      retry: (failureCount, error) => {
        const appError = normalizeSupabaseError(error)
        
        // Jangan retry jika error terkait auth (401), permission (403), kuota (402), atau logic business (400)
        if ([401, 403, 400, 402].includes(appError.status)) {
          return false
        }
        
        // Retry maksimal 1 kali untuk error lainnya (network, 500, dll)
        return failureCount < 1
      },
    },
    mutations: {
      retry: 0,  // jangan retry mutasi — biar user retry manual
    },
  },
})
