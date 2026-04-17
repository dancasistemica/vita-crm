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
  console.log('');
  console.log('[financeService] 💰 INICIANDO cálculo de métricas');
  console.log('[financeService] Organization ID:', organizationId);
  console.log('');

  try {
    // BUSCA 1: Vendas
    console.log('[financeService] 🔍 Buscando vendas...');
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, value')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    if (salesError) {
      console.error('[financeService] ❌ ERRO ao buscar sales:', salesError);
      throw salesError;
    }

    console.log('[financeService] ✅ Vendas encontradas:', sales?.length || 0);
    const totalSales = sales?.reduce((sum, s) => sum + (Number(s.value) || 0), 0) || 0;
    console.log('[financeService] Total vendas: R$', totalSales.toFixed(2));
    console.log('');

    // BUSCA 2: Mensalidades
    console.log('[financeService] 🔍 Buscando mensalidades...');
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, monthly_value')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    if (subsError) {
      console.error('[financeService] ❌ ERRO ao buscar subscriptions:', subsError);
      throw subsError;
    }

    console.log('[financeService] ✅ Mensalidades encontradas:', subs?.length || 0);
    const totalSubs = subs?.reduce((sum, s) => sum + (Number(s.monthly_value) || 0), 0) || 0;
    console.log('[financeService] Total MRR: R$', totalSubs.toFixed(2));
    console.log('');

    const metrics: FinancialMetrics = {
      totalRevenue: totalSales + totalSubs,
      mrrValue: totalSubs,
      uniqueSalesCount: sales?.length || 0,
      subscriptionCount: subs?.length || 0,
      avgTicketUnique: sales && sales.length > 0 ? totalSales / sales.length : 0,
      avgTicketSubscription: subs && subs.length > 0 ? totalSubs / subs.length : 0,
      totalUniqueRevenue: totalSales,
      totalSubscriptionRevenue: totalSubs,
      subscriptionPercentage: (totalSales + totalSubs) > 0 ? (totalSubs / (totalSales + totalSubs)) * 100 : 0,
      uniquePercentage: (totalSales + totalSubs) > 0 ? (totalSales / (totalSales + totalSubs)) * 100 : 0,
    };

    console.log('[financeService] ✅ Métricas calculadas:', metrics);
    console.log('');

    return metrics;

  } catch (error) {
    console.error('[financeService] ❌ ERRO crítico:', error);
    throw error;
  }
};
