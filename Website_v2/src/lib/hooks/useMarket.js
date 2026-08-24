import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { logSupabaseError } from '../logger/supabaseLogger'

export const useMarketListings = (filters) => useQuery({
  queryKey: ['market-listings', filters],
  queryFn: async () => {
    let query = supabase
      .from('market_listings')
      .select('*, tenants(business_name, business_vertical)')
      .eq('is_deleted', false)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filters?.type)         query = query.eq('listing_type', filters.type)
    if (filters?.chicken_type) query = query.eq('chicken_type', filters.chicken_type)
    if (filters?.search)       query = query.ilike('title', '%' + filters.search + '%')
    if (filters?.location)     query = query.ilike('location', '%' + filters.location + '%')

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }
})

export const useMyListings = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['my-listings', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_listings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id
  })
}

export const useCreateListing = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (listing) => {
      const { error } = await supabase
        .from('market_listings')
        .insert({ ...listing, tenant_id: tenant.id })
      if (error) {
        logSupabaseError(error, { table: 'market_listings', operation: 'insert', component: 'useMarket', actionName: 'market.listing.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings', tenant?.id] })
      toast.success('Listing berhasil dipublikasikan!')
    },
    onError: (err) => toast.error('Gagal pasang iklan: ' + err.message)
  })
}

export const useCloseListing = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('market_listings')
        .update({ status: 'closed' })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'market_listings', operation: 'update', component: 'useMarket', actionName: 'market.listing.close' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings', tenant?.id] })
      toast.success('Listing ditutup')
    },
    onError: (err) => toast.error('Gagal tutup listing: ' + err.message)
  })
}

export const useDeleteListing = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('market_listings')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'market_listings', operation: 'update', component: 'useMarket', actionName: 'market.listing.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings', tenant?.id] })
      toast.success('Listing dihapus')
    },
    onError: (err) => toast.error('Gagal hapus listing: ' + err.message)
  })
}
