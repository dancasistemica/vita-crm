import { supabase } from '../lib/supabase';

// Helper to map SellFlux status to CRM status
const mapSellfluxOrderStatus = (sellfluxStatus: string): string => {
  const mapping: Record<string, string> = {
    'paid': 'pago',
    'pending': 'pendente',
    'canceled': 'cancelado',
    'refunded': 'reembolsado',
    'expired': 'expirado',
    // Add more mappings as needed based on SellFlux documentation
  };
  return mapping[sellfluxStatus] || sellfluxStatus;
};

const mapSellfluxSubscriptionStatus = (sellfluxStatus: string): string => {
  const mapping: Record<string, string> = {
    'active': 'ativo',
    'inactive': 'inativo',
    'canceled': 'cancelado',
    'trialing': 'trial',
    'past_due': 'atrasado',
  };
  return mapping[sellfluxStatus] || sellfluxStatus;
};

// ============================================
// SINCRONIZAR CLIENTE (Customer)
// ============================================
export const syncCustomerFromSellflux = async (
  organizationId: string,
  sellfluxCustomer: any
) => {
  console.log('[sellfluxService] 👤 SINCRONIZANDO cliente SellFlux', sellfluxCustomer.id);

  try {
    const leadData: any = {
      organization_id: organizationId,
      sellflux_customer_id: sellfluxCustomer.id,
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
    };

    // Verificando se cliente já existe
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_customer_id', String(sellfluxCustomer.id))
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingLead) {
      console.log('[sellfluxService] ♻️ Atualizando cliente existente:', existingLead.id);
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      console.log('[sellfluxService] ➕ Criando novo cliente...');
      leadData.created_at = new Date().toISOString();
      leadData.entry_date = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('[sellfluxService] ❌ ERRO ao sincronizar cliente:', error);
    throw error;
  }
};

// ============================================
// SINCRONIZAR VENDA (Order)
// ============================================
export const syncOrderFromSellflux = async (
  organizationId: string,
  sellfluxOrder: any
) => {
  console.log('[sellfluxService] 💰 SINCRONIZANDO venda SellFlux', sellfluxOrder.id);

  try {
    // Buscar cliente no CRM
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_customer_id', String(sellfluxOrder.customer_id))
      .maybeSingle();

    if (!lead) {
      console.error('[sellfluxService] ❌ Cliente não encontrado:', sellfluxOrder.customer_id);
      throw new Error(`Cliente SellFlux ${sellfluxOrder.customer_id} não encontrado no CRM. Sincronize o cliente primeiro.`);
    }

    // Buscar produto no CRM
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_product_id', String(sellfluxOrder.product_id))
      .maybeSingle();

    const saleData: any = {
      organization_id: organizationId,
      lead_id: lead.id, // Empregando lead_id conforme schema real
      product_id: product?.id || null,
      sellflux_order_id: String(sellfluxOrder.id),
      value: sellfluxOrder.total_amount || sellfluxOrder.value || 0,
      status: mapSellfluxOrderStatus(sellfluxOrder.status),
      sale_date: sellfluxOrder.created_at || new Date().toISOString().split('T')[0],
      payment_method: sellfluxOrder.payment_method || null,
      updated_at: new Date().toISOString(),
    };

    // Verificar se venda já existe
    const { data: existingSale, error: checkError } = await supabase
      .from('sales')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_order_id', String(sellfluxOrder.id))
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingSale) {
      console.log('[sellfluxService] ♻️ Atualizando venda existente:', existingSale.id);
      const { data, error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', existingSale.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      console.log('[sellfluxService] ➕ Criando nova venda...');
      saleData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('[sellfluxService] ❌ ERRO ao sincronizar venda:', error);
    throw error;
  }
};

// ============================================
// SINCRONIZAR ASSINATURA (Subscription)
// ============================================
export const syncSubscriptionFromSellflux = async (
  organizationId: string,
  sellfluxSubscription: any
) => {
  console.log('[sellfluxService] 🔁 SINCRONIZANDO assinatura SellFlux', sellfluxSubscription.id);

  try {
    // Buscar cliente no CRM
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_customer_id', String(sellfluxSubscription.customer_id))
      .maybeSingle();

    if (!lead) {
      throw new Error(`Cliente SellFlux ${sellfluxSubscription.customer_id} não encontrado`);
    }

    // Buscar produto no CRM
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_product_id', String(sellfluxSubscription.product_id))
      .maybeSingle();

    const subData: any = {
      organization_id: organizationId,
      client_id: lead.id, // Subscriptions usa client_id no schema real
      product_id: product?.id || null,
      sellflux_id: String(sellfluxSubscription.id),
      monthly_value: sellfluxSubscription.amount || sellfluxSubscription.monthly_value || 0,
      status: mapSellfluxSubscriptionStatus(sellfluxSubscription.status),
      start_date: sellfluxSubscription.start_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    // Verificar se assinatura já existe
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('sellflux_id', String(sellfluxSubscription.id))
      .maybeSingle();

    if (existingSub) {
      console.log('[sellfluxService] ♻️ Atualizando assinatura:', existingSub.id);
      const { data, error } = await supabase
        .from('subscriptions')
        .update(subData)
        .eq('id', existingSub.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      console.log('[sellfluxService] ➕ Criando nova assinatura...');
      subData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('[sellfluxService] ❌ ERRO ao sincronizar assinatura:', error);
    throw error;
  }
};
