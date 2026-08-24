import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateInvoiceNumber } from './invoiceUtils'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// ── Query: invoice history per reference ─────────────────────────────────────

export const useGeneratedInvoices = (referenceId) => useQuery({
  queryKey: ['generated-invoices', referenceId],
  enabled: !!referenceId,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('generated_invoices')
      .select('*')
      .eq('reference_id', referenceId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
})

// ── Mutation: simpan invoice ke generated_invoices ───────────────────────────

export const useSaveInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      invoice_type,
      reference_id,
      recipient_name,
      total_amount,
      metadata,
    }) => {
      const { data: authData } = await supabase.auth.getUser()
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('tenant_id, id')
        .eq('auth_user_id', authData.user.id)
        .single()
      if (profileErr) throw profileErr

      const invoice_number = generateInvoiceNumber(invoice_type)

      const { data, error } = await supabase
        .from('generated_invoices')
        .insert({
          tenant_id:      profile.tenant_id,
          invoice_type,
          reference_id,
          invoice_number,
          recipient_name,
          total_amount,
          metadata,
          created_by:     profile.id,
          status:         'draft',
        })
        .select()
        .single()
      if (error) {
        logSupabaseError(error, { table: 'generated_invoices', operation: 'insert', component: 'useInvoice', actionName: 'invoice.generate' })
        throw error
      }
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['generated-invoices', vars.reference_id] })
    },
  })
}
