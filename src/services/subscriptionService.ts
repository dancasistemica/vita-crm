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
    console.log('[SubscriptionService] Criando mensalidade:', {
      client_id: data.client_id,
      monthly_value: data.monthly_value,
      start_date: data.start_date,
      first_payment_due_date: data.first_payment_due_date,
    });

    // PASSO 1: Criar subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions' as any)
      .insert({
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
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('[SubscriptionService] ❌ Erro ao criar subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('[SubscriptionService] ✅ Subscription criada:', (subscription as any).id);

    // PASSO 2: Criar primeira parcela
    const { error: firstPaymentError } = await supabase
      .from('subscription_payments' as any)
      .insert({
        subscription_id: (subscription as any).id,
        organization_id: organizationId,
        payment_number: 1,
        due_date: data.first_payment_due_date,
        amount: data.monthly_value,
        status: 'pendente',
        auto_payment_enabled: data.auto_payment_enabled,
      });

    if (firstPaymentError) {
      console.error('[SubscriptionService] ❌ Erro ao criar primeira parcela:', firstPaymentError);
      throw firstPaymentError;
    }

    console.log('[SubscriptionService] ✅ Primeira parcela criada');
    return subscription;
  } catch (error) {
    console.error('[SubscriptionService] ❌ Erro crítico:', error);
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
