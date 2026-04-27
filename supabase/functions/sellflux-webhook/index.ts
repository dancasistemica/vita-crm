import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    console.log('[sellflux-webhook] 📩 Recebido payload:', JSON.stringify(payload, null, 2))

    // Tentar obter organization_id do query param ou do payload
    const url = new URL(req.url)
    let organizationId = url.searchParams.get('org_id')

    if (!organizationId && payload.organization_id) {
      organizationId = payload.organization_id
    }

    // Fallback para a primeira organização se não fornecido (ajuste conforme necessário)
    if (!organizationId) {
      const { data: org } = await supabase.from('organizations').select('id').limit(1).single()
      organizationId = org?.id
    }

    if (!organizationId) {
      throw new Error('Organization ID não encontrado')
    }

    const event = payload.event || payload.type
    const data = payload.data || payload

    let result
    switch (event) {
      case 'customer.created':
      case 'customer.updated':
      case 'contact.created':
      case 'contact.updated':
        console.log('[sellflux-webhook] 👤 Processando cliente...')
        // Chamando lógica de sincronização (reimplementada aqui para evitar dependência de src no Edge Function)
        result = await syncCustomer(supabase, organizationId, data)
        break

      case 'order.created':
      case 'order.paid':
      case 'order.updated':
      case 'sale.created':
        console.log('[sellflux-webhook] 💰 Processando venda...')
        result = await syncOrder(supabase, organizationId, data)
        break

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.paid':
        console.log('[sellflux-webhook] 🔁 Processando assinatura...')
        result = await syncSubscription(supabase, organizationId, data)
        break

      default:
        console.log(`[sellflux-webhook] ℹ️ Evento ignorado: ${event}`)
        return new Response(JSON.stringify({ message: `Evento ${event} ignorado` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[sellflux-webhook] ❌ Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function syncCustomer(supabase: any, organizationId: string, sellfluxCustomer: any) {
  const leadData = {
    organization_id: organizationId,
    sellflux_customer_id: String(sellfluxCustomer.id),
    name: sellfluxCustomer.name,
    email: sellfluxCustomer.email,
    phone: sellfluxCustomer.phone,
    city: sellfluxCustomer.city || null,
    cpf: sellfluxCustomer.cpf || null,
    instagram: sellfluxCustomer.instagram || null,
    tags: sellfluxCustomer.tags ? (Array.isArray(sellfluxCustomer.tags) ? sellfluxCustomer.tags : [sellfluxCustomer.tags]) : null,
    origin: 'sellflux',
    pipeline_stage: 'cliente',
    updated_at: new Date().toISOString(),
  }

  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_customer_id', String(sellfluxCustomer.id))
    .maybeSingle()

  if (existingLead) {
    const { data, error } = await supabase
      .from('leads')
      .update(leadData)
      .eq('id', existingLead.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...leadData, created_at: new Date().toISOString(), entry_date: new Date().toISOString().split('T')[0] }])
      .select()
      .single()
    if (error) throw error
    return data
  }
}

async function syncOrder(supabase: any, organizationId: string, sellfluxOrder: any) {
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_customer_id', String(sellfluxOrder.customer_id))
    .maybeSingle()

  if (!lead) throw new Error(`Cliente ${sellfluxOrder.customer_id} não encontrado`)

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_product_id', String(sellfluxOrder.product_id))
    .maybeSingle()

  const saleData = {
    organization_id: organizationId,
    lead_id: lead.id,
    product_id: product?.id || null,
    sellflux_order_id: String(sellfluxOrder.id),
    value: sellfluxOrder.total_amount || sellfluxOrder.value || 0,
    status: mapStatus(sellfluxOrder.status),
    sale_date: sellfluxOrder.created_at || new Date().toISOString().split('T')[0],
    payment_method: sellfluxOrder.payment_method || null,
    updated_at: new Date().toISOString(),
  }

  const { data: existingSale } = await supabase
    .from('sales')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_order_id', String(sellfluxOrder.id))
    .maybeSingle()

  if (existingSale) {
    const { data, error } = await supabase
      .from('sales')
      .update(saleData)
      .eq('id', existingSale.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('sales')
      .insert([{ ...saleData, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw error
    return data
  }
}

async function syncSubscription(supabase: any, organizationId: string, sellfluxSub: any) {
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_customer_id', String(sellfluxSub.customer_id))
    .maybeSingle()

  if (!lead) throw new Error(`Cliente ${sellfluxSub.customer_id} não encontrado`)

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_product_id', String(sellfluxSub.product_id))
    .maybeSingle()

  const subData = {
    organization_id: organizationId,
    client_id: lead.id,
    product_id: product?.id || null,
    sellflux_id: String(sellfluxSub.id),
    monthly_value: sellfluxSub.amount || sellfluxSub.monthly_value || 0,
    status: mapSubStatus(sellfluxSub.status),
    start_date: sellfluxSub.start_date || new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('sellflux_id', String(sellfluxSub.id))
    .maybeSingle()

  if (existingSub) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subData)
      .eq('id', existingSub.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{ ...subData, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw error
    return data
  }
}

function mapStatus(s: string) {
  const m: any = { 'paid': 'pago', 'pending': 'pendente', 'canceled': 'cancelado' }
  return m[s] || s
}

function mapSubStatus(s: string) {
  const m: any = { 'active': 'ativo', 'inactive': 'inativo', 'canceled': 'cancelado' }
  return m[s] || s
}
