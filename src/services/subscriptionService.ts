import { supabase } from '@/integrations/supabase/client';
import { convertLeadToClient } from './saleService';

interface CreateSubscriptionInput {
  client_id: string;
  product_id: string;
  sales_stage_id: string;
  monthly_value: number;
  start_date: string;
  end_date?: string;
  payment_method_id: string;
  auto_payment_enabled: boolean;
  notes?: string;
  first_payment_due_date: string;
}

export const createSubscription = async (
  organizationId: string,
  data: CreateSubscriptionInput
) => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SubscriptionService] 🚀 INICIANDO createSubscription');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SubscriptionService] Timestamp:', new Date().toISOString());
    console.log('[SubscriptionService] Organization ID:', organizationId);
    console.log('[SubscriptionService] Dados recebidos:', JSON.stringify(data, null, 2));
    console.log('');

    if (!organizationId) {
      console.error('[SubscriptionService] ❌ ERRO: organizationId ausente');
      throw new Error('organizationId ausente');
    }

    // PASSO 1: Criar subscription
    console.log('[SubscriptionService] 📍 PASSO 1: Inserindo na tabela "subscriptions"...');
    
    const subscriptionData = {
      organization_id: organizationId,
      client_id: data.client_id,
      product_id: data.product_id,
      sales_stage_id: data.sales_stage_id,
      monthly_value: data.monthly_value,
      start_date: data.start_date,
      end_date: data.end_date || null,
      status: 'ativa',
      payment_method_id: data.payment_method_id,
      auto_payment_enabled: data.auto_payment_enabled,
      notes: data.notes || '',
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions' as any)
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      console.error('[SubscriptionService] ❌ ERRO ao criar subscription:', subscriptionError);
      console.error('[SubscriptionService] Código:', subscriptionError.code);
      console.error('[SubscriptionService] Mensagem:', subscriptionError.message);
      throw subscriptionError;
    }

    console.log('[SubscriptionService] ✅ Subscription criada com sucesso! ID:', (subscription as any).id);

    // PASSO 2: Criar primeira parcela
    console.log('[SubscriptionService] 📍 PASSO 2: Criando primeira parcela...');
    
    const paymentData = {
      subscription_id: (subscription as any).id,
      organization_id: organizationId,
      payment_number: 1,
      due_date: data.first_payment_due_date,
      amount: data.monthly_value,
      status: 'pendente',
      auto_payment_enabled: data.auto_payment_enabled,
    };

    const { error: firstPaymentError } = await supabase
      .from('subscription_payments' as any)
      .insert(paymentData);

    if (firstPaymentError) {
      console.error('[SubscriptionService] ❌ ERRO ao criar primeira parcela:', firstPaymentError);
      console.error('[SubscriptionService] Código:', firstPaymentError.code);
      console.error('[SubscriptionService] Mensagem:', firstPaymentError.message);
      throw firstPaymentError;
    }

    console.log('[SubscriptionService] ✅ Primeira parcela criada');
    
    // PASSO 3: Registrar relacionamento com produto em client_products
    console.log('[SubscriptionService] 📍 PASSO 3: Registrando relacionamento com produto...');
    try {
      const { error: cpError } = await supabase
        .from('client_products')
        .upsert({
          organization_id: organizationId,
          client_id: data.client_id,
          product_id: data.product_id,
          payment_status: 'ATIVO',
          start_date: data.start_date || new Date().toISOString().split('T')[0],
          plan_type: 'MENSALIDADE'
        }, { onConflict: 'client_id,product_id' });
      
      if (cpError) {
        console.error('[SubscriptionService] ❌ Erro no upsert de client_products:', cpError);
      } else {
        console.log('[SubscriptionService] ✅ Relacionamento client_product registrado');
      }
    } catch (cpErr) {
      console.warn('[SubscriptionService] ⚠️ Erro inesperado ao registrar client_product:', cpErr);
    }

    // PASSO 4: Converter lead em cliente
    console.log('[SubscriptionService] 📍 PASSO 3: Convertendo lead em cliente...');
    await convertLeadToClient(data.client_id, organizationId);
    console.log('[SubscriptionService] ✅ Lead convertido');

    console.log('═══════════════════════════════════════════════════════');
    console.log('[SubscriptionService] ✅ SUCESSO: Mensalidade criada');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    return subscription;
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[SubscriptionService] ❌ ERRO CRÍTICO em createSubscription');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[SubscriptionService] Detalhes do erro:', error);
    console.error('');
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string) => {
  const { error } = await supabase
    .from('subscriptions' as any)
    .update({ status: 'cancelada' })
    .eq('id', subscriptionId);

  if (error) throw error;
  console.log('[SubscriptionService] ✅ Mensalidade cancelada');
};

export const deleteSubscription = async (subscriptionId: string) => {
  try {
    console.log('[SubscriptionService] Excluindo mensalidade e pagamentos:', subscriptionId);
    
    // Excluir pagamentos primeiro
    const { error: paymentsError } = await supabase
      .from('subscription_payments')
      .delete()
      .eq('subscription_id', subscriptionId);

    if (paymentsError) {
      console.error('[SubscriptionService] ❌ Erro ao excluir pagamentos:', paymentsError);
      throw paymentsError;
    }

    // Excluir mensalidade
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (subscriptionError) {
      console.error('[SubscriptionService] ❌ Erro ao excluir mensalidade:', subscriptionError);
      throw subscriptionError;
    }

    console.log('[SubscriptionService] ✅ Mensalidade excluída com sucesso');
    return true;
  } catch (error) {
    console.error('[SubscriptionService] ❌ Erro crítico ao excluir mensalidade:', error);
    throw error;
  }
};
