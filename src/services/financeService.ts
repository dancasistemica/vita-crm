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
  console.log('═══════════════════════════════════════════════════════');
  console.log('[financeService] 💰 INICIANDO cálculo de métricas financeiras');
  console.log('═══════════════════════════════════════════════════════');
  console.log('[financeService] Organization ID recebido:', organizationId);
  console.log('[financeService] Timestamp:', new Date().toISOString());
  console.log('');

  try {
    // BUSCA 1: Vendas únicas
    console.log('[financeService] 🔍 PASSO 1: Buscando vendas únicas (status=ativo)...');
    const { data: uniqueSales, error: uniqueError } = await supabase
      .from('sales')
      .select('id, value, status, organization_id')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    if (uniqueError) {
      console.error('[financeService] ❌ ERRO ao buscar sales:', uniqueError);
      throw uniqueError;
    }

    console.log('[financeService] ✅ Busca concluída');
    console.log('[financeService] Vendas únicas encontradas:', uniqueSales?.length || 0);
    
    if (uniqueSales && uniqueSales.length > 0) {
      console.log('[financeService] Primeiras 3 vendas:', JSON.stringify(uniqueSales.slice(0, 3), null, 2));
      
      // Log detalhado de cada venda
      uniqueSales.forEach((sale, index) => {
        console.log(`[financeService] Venda ${index + 1}: ID=${sale.id} | Valor=${sale.value} | Status=${sale.status}`);
      });
    } else {
      console.log('[financeService] ⚠️ Nenhuma venda única encontrada');
    }

    const uniqueSalesCount = uniqueSales?.length || 0;
    const totalUniqueRevenue = uniqueSales?.reduce((sum, sale) => {
      const value = parseFloat(String(sale.value || 0));
      return sum + value;
    }, 0) || 0;

    const avgTicketUnique = uniqueSalesCount > 0 ? totalUniqueRevenue / uniqueSalesCount : 0;

    console.log('[financeService] 📊 Resumo Vendas Únicas:', {
      count: uniqueSalesCount,
      totalRevenue: totalUniqueRevenue,
      avgTicket: avgTicketUnique,
    });
    console.log('');

    // BUSCA 2: Mensalidades ativas
    console.log('[financeService] 🔍 PASSO 2: Buscando mensalidades ativas (status=ativo)...');
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, monthly_value, status, organization_id')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    if (subscriptionError) {
      console.error('[financeService] ❌ ERRO ao buscar subscriptions:', subscriptionError);
      throw subscriptionError;
    }

    console.log('[financeService] ✅ Busca concluída');
    console.log('[financeService] Mensalidades encontradas:', subscriptions?.length || 0);
    
    if (subscriptions && subscriptions.length > 0) {
      console.log('[financeService] Primeiras 3 mensalidades:', JSON.stringify(subscriptions.slice(0, 3), null, 2));
      
      // Log detalhado de cada mensalidade
      subscriptions.forEach((sub, index) => {
        console.log(`[financeService] Mensalidade ${index + 1}: ID=${sub.id} | Valor=${sub.monthly_value} | Status=${sub.status}`);
      });
    } else {
      console.log('[financeService] ⚠️ Nenhuma mensalidade encontrada');
    }

    const subscriptionCount = subscriptions?.length || 0;
    const totalSubscriptionRevenue = subscriptions?.reduce((sum, sub) => {
      const value = parseFloat(String(sub.monthly_value || 0));
      return sum + value;
    }, 0) || 0;

    const avgTicketSubscription = subscriptionCount > 0 ? totalSubscriptionRevenue / subscriptionCount : 0;

    console.log('[financeService] 📊 Resumo Mensalidades:', {
      count: subscriptionCount,
      mrrValue: totalSubscriptionRevenue,
      avgTicket: avgTicketSubscription,
    });
    console.log('');

    // CÁLCULOS FINAIS
    console.log('[financeService] 🔢 PASSO 3: Calculando métricas finais...');
    const mrrValue = totalSubscriptionRevenue;
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

    console.log('[financeService] ✅ MÉTRICAS FINAIS CALCULADAS:');
    console.log('');
    console.log('  📊 BREAKDOWN COMPLETO:');
    console.log('  ├─ Receita Total: R$', totalRevenue.toFixed(2));
    console.log('  ├─ MRR (Mensalidades): R$', mrrValue.toFixed(2));
    console.log('  ├─ Receita Vendas Únicas: R$', totalUniqueRevenue.toFixed(2));
    console.log('  ├─ Ticket Médio (Único): R$', avgTicketUnique.toFixed(2));
    console.log('  ├─ Ticket Médio (Mensalidade): R$', avgTicketSubscription.toFixed(2));
    console.log('  ├─ % Mensalidades:', subscriptionPercentage.toFixed(1) + '%');
    console.log('  └─ % Vendas Únicas:', uniquePercentage.toFixed(1) + '%');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[financeService] ✅ calculateFinancialMetrics finalizado com sucesso');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    return metrics;

  } catch (error) {
    console.error('[financeService] ❌ ERRO CRÍTICO ao calcular métricas:', error);
    throw error;
  }
};
