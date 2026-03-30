import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

serve(async (_req) => {
  try {
    console.log('[GenerateSubscriptionPayments] Iniciando geração de parcelas mensais')

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Buscar assinaturas ativas
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, organization_id, client_id, monthly_value, start_date, end_date, auto_payment_enabled')
      .eq('status', 'ativa')

    if (fetchError) {
      console.error('[GenerateSubscriptionPayments] ❌ Erro ao buscar assinaturas:', fetchError)
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), { status: 500, headers: { "Content-Type": "application/json" } })
    }

    console.log(`[GenerateSubscriptionPayments] ${subscriptions?.length || 0} assinaturas ativas`)

    let generatedCount = 0

    for (const sub of (subscriptions || [])) {
      // Check if end_date passed
      if (sub.end_date && sub.end_date < todayStr) {
        console.log(`[GenerateSubscriptionPayments] Assinatura ${sub.id} expirada, pulando`)
        continue
      }

      // Get last payment to determine next payment number and due date
      const { data: lastPayment } = await supabase
        .from('subscription_payments')
        .select('payment_number, due_date')
        .eq('subscription_id', sub.id)
        .order('payment_number', { ascending: false })
        .limit(1)
        .single()

      if (!lastPayment) continue

      const lastDueDate = new Date(lastPayment.due_date)
      const nextDueDate = new Date(lastDueDate)
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
      const nextDueDateStr = nextDueDate.toISOString().split('T')[0]

      // Only generate if next due date is within 5 days from now
      const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDue > 5) continue

      // Check if payment already exists
      const { data: existing } = await supabase
        .from('subscription_payments')
        .select('id')
        .eq('subscription_id', sub.id)
        .eq('payment_number', lastPayment.payment_number + 1)
        .maybeSingle()

      if (existing) continue

      // Create next payment
      const { error: insertError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: sub.id,
          organization_id: sub.organization_id,
          payment_number: lastPayment.payment_number + 1,
          due_date: nextDueDateStr,
          amount: sub.monthly_value,
          status: 'pendente',
          auto_payment_enabled: sub.auto_payment_enabled,
        })

      if (insertError) {
        console.error(`[GenerateSubscriptionPayments] ❌ Erro parcela sub ${sub.id}:`, insertError)
      } else {
        console.log(`[GenerateSubscriptionPayments] ✅ Parcela ${lastPayment.payment_number + 1} gerada para sub ${sub.id}`)
        generatedCount++
      }
    }

    console.log(`[GenerateSubscriptionPayments] ✅ Concluído: ${generatedCount} parcelas geradas`)

    return new Response(
      JSON.stringify({ success: true, generatedCount, timestamp: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('[GenerateSubscriptionPayments] ❌ Erro crítico:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
