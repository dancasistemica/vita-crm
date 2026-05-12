import { supabase } from '../lib/supabase';

export interface FinancialMetrics {
  totalRevenue: number; // Receita total (Recebido + A Receber)
  receivedRevenue: number; // Recebido
  toReceiveRevenue: number; // A Receber (Previsão)
  totalExpenses: number; // Despesas totais (Previsto)
  paidExpenses: number; // Pago
  pendingExpenses: number; // A pagar (Previsto - Pago)
  mrrValue: number; // Receita Recorrente Mensal
  uniqueSalesCount: number; // Quantidade de vendas únicas
  subscriptionCount: number; // Quantidade de mensalidades
  avgTicketUnique: number; 
  avgTicketSubscription: number;
  subscriptionPercentage: number;
  uniquePercentage: number;
}

export const calculateFinancialMetrics = async (
  organizationId: string
): Promise<FinancialMetrics> => {
  try {
    // We can reuse getFinancialTransactions logic or fetch here.
    // Let's fetch the 3 main sources for the dashboard summary.
    
    // 1. Sales & Installments
    const { data: installments } = await supabase
      .from('sale_installments')
      .select('amount, status')
      .eq('organization_id', organizationId);
      
    // 2. Subscriptions & Payments
    const { data: subPayments } = await supabase
      .from('subscription_payments')
      .select('amount, status')
      .eq('organization_id', organizationId);
      
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('monthly_value')
      .eq('organization_id', organizationId)
      .eq('status', 'ativa');
      
    // 3. Manual Transactions
    const { data: manualTx } = await supabase
      .from('financial_transactions')
      .select('amount, type, status')
      .eq('organization_id', organizationId);

    let received = 0;
    let toReceive = 0;
    let expenses = 0;

    // Process Installments
    installments?.forEach(inst => {
      const val = Number(inst.amount) || 0;
      if (inst.status === 'pago') received += val;
      else if (inst.status !== 'cancelado') toReceive += val;
    });

    // Process Subscription Payments
    subPayments?.forEach(pay => {
      const val = Number(pay.amount) || 0;
      if (pay.status === 'pago') received += val;
      else if (pay.status !== 'cancelado') toReceive += val;
    });

    // Process Manual
    manualTx?.forEach(tx => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'receita') {
        if (tx.status === 'pago') received += val;
        else if (tx.status !== 'cancelado') toReceive += val;
      } else {
        expenses += val;
      }
    });

    const mrr = subs?.reduce((sum, s) => sum + (Number(s.monthly_value) || 0), 0) || 0;
    const totalRev = received + toReceive;

    return {
      totalRevenue: totalRev,
      receivedRevenue: received,
      toReceiveRevenue: toReceive,
      totalExpenses: expenses,
      mrrValue: mrr,
      uniqueSalesCount: installments?.length || 0,
      subscriptionCount: subs?.length || 0,
      avgTicketUnique: installments && installments.length > 0 ? (received + toReceive - mrr) / installments.length : 0,
      avgTicketSubscription: subs && subs.length > 0 ? mrr / subs.length : 0,
      subscriptionPercentage: totalRev > 0 ? (mrr / totalRev) * 100 : 0,
      uniquePercentage: totalRev > 0 ? ((totalRev - mrr) / totalRev) * 100 : 0,
    };
  } catch (error) {
    console.error('[financeService] ❌ ERRO crítico:', error);
    throw error;
  }
};
