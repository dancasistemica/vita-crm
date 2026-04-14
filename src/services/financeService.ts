import { supabase } from '../lib/supabase';

export interface FinancialMetrics {
  totalRevenue: number; // Receita total (vendas + mensalidades)
  mrrValue: number; // Receita Recorrente Mensal
  uniqueSalesCount: number; // Quantidade de vendas únicas
  subscriptionCount: number; // Quantidade de mensalidades
  avgTicketUnique: number; // Ticket médio de vendas únicas
  avgTicketSubscription: number; // Ticket médio de mensalidades
  totalUniqueRevenue: number; // Receita total de vendas únicas
  totalSubscriptionRevenue: number; // Receita total de mensalidades (mensal)
  subscriptionPercentage: number; // % de receita recorrente
  uniquePercentage: number; // % de vendas únicas
}

export const calculateFinancialMetrics = async (
  organizationId: string
): Promise<FinancialMetrics> => {
  console.log('[financeService] 💰 Calculando métricas financeiras');
  console.log('[financeService] Organization ID:', organizationId);
  console.log('[financeService] Timestamp:', new Date().toISOString());

  try {
    // BUSCA 1: Vendas únicas
    console.log('[financeService] 🔍 Buscando vendas únicas...');
    const { data: uniqueSales, error: uniqueError } = await supabase
      .from('sales')
      .select('id, value')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    if (uniqueError) {
      console.error('[financeService] ❌ ERRO ao buscar sales:', uniqueError);
      throw uniqueError;
    }

    const totalUniqueRevenue = uniqueSales?.reduce((sum, sale) => sum + Number(sale.value || 0), 0) || 0;
    const uniqueSalesCount = uniqueSales?.length || 0;
    const avgTicketUnique = uniqueSalesCount > 0 ? totalUniqueRevenue / uniqueSalesCount : 0;

    console.log('[financeService] ✅ Vendas únicas:', {
      count: uniqueSalesCount,
      totalRevenue: totalUniqueRevenue,
      avgTicket: avgTicketUnique,
    });

    // BUSCA 2: Mensalidades ativas
    console.log('[financeService] 🔍 Buscando mensalidades ativas...');
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, monthly_value')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    if (subscriptionError) {
      console.error('[financeService] ❌ ERRO ao buscar subscriptions:', subscriptionError);
      throw subscriptionError;
    }

    const totalSubscriptionRevenue = subscriptions?.reduce((sum, sub) => sum + Number(sub.monthly_value || 0), 0) || 0;
    const subscriptionCount = subscriptions?.length || 0;
    const avgTicketSubscription = subscriptionCount > 0 ? totalSubscriptionRevenue / subscriptionCount : 0;

    console.log('[financeService] ✅ Mensalidades:', {
      count: subscriptionCount,
      mrrValue: totalSubscriptionRevenue,
      avgTicket: avgTicketSubscription,
    });

    // CÁLCULOS
    const mrrValue = totalSubscriptionRevenue; // MRR = soma de todas as mensalidades ativas
    const totalRevenue = totalUniqueRevenue + mrrValue;
    const subscriptionPercentage = totalRevenue > 0 ? (mrrValue / totalRevenue) * 100 : 0;
    const uniquePercentage = totalRevenue > 0 ? (totalUniqueRevenue / totalRevenue) * 100 : 0;

    const metrics: FinancialMetrics = {
      totalRevenue,
      mrrValue,
      uniqueSalesCount,
      subscriptionCount,
      avgTicketUnique,
      avgTicketSubscription,
      totalUniqueRevenue,
      totalSubscriptionRevenue,
      subscriptionPercentage,
      uniquePercentage,
    };

    console.log('[financeService] 📊 Métricas calculadas:', JSON.stringify(metrics, null, 2));
    console.log('');

    return metrics;

  } catch (error) {
    console.error('[financeService] ❌ ERRO crítico ao calcular métricas:', error);
    throw error;
  }
};
