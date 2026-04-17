import { supabase } from '../lib/supabase';

export interface Installment {
  id: string;
  sale_id: string;
  installment_number: number;
  due_date: string;
  paid_date: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  client_name: string;
  product_name: string;
  days_overdue: number;
}

export const getInstallments = async (
  organizationId: string,
  filters?: {
    status?: string;
    clientId?: string;
    productId?: string;
    dateRange?: { from: string; to: string };
  }
) => {
  console.log('[installmentService] 📋 Buscando parcelas');
  console.log('[installmentService] Organization ID:', organizationId);
  console.log('[installmentService] Filtros:', filters);
  console.log('');

  try {
    let query = supabase
      .from('sale_installments')
      .select(`
        id,
        sale_id,
        installment_number,
        due_date,
        paid_date,
        amount,
        status,
        payment_method,
        sales(
          lead_id,
          leads:lead_id(name),
          products:product_id(name)
        )
      `)
      .eq('organization_id', organizationId);

    // Aplicar filtros
    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }

    // Nota: Filtros de clientId e productId em tabelas relacionadas (sales)
    // requerem sintaxe específica ou filtragem manual se não houver joins complexos habilitados.
    // Aqui assumimos que o Supabase permite o filtro direto ou faremos pós-processamento se necessário.

    const { data: installments, error } = await query.order('due_date', { ascending: false });

    if (error) {
      console.error('[installmentService] ❌ ERRO ao buscar parcelas:', error);
      throw error;
    }

    console.log('[installmentService] ✅ Parcelas encontradas:', installments?.length || 0);

    // Processar dados e calcular dias em atraso
    const processedInstallments: Installment[] = (installments || []).map(inst => {
      const daysOverdue = inst.status === 'atrasado' 
        ? Math.floor((new Date().getTime() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const salesData = inst.sales as any;

      return {
        id: inst.id,
        sale_id: inst.sale_id,
        installment_number: inst.installment_number,
        due_date: inst.due_date,
        paid_date: inst.paid_date,
        amount: inst.amount,
        status: inst.status,
        payment_method: inst.payment_method,
        client_name: salesData?.leads?.name || 'Desconhecido',
        product_name: salesData?.products?.name || 'Desconhecido',
        days_overdue: daysOverdue,
      };
    });

    // Filtros manuais para campos em tabelas relacionadas se necessário
    let filtered = processedInstallments;
    if (filters?.clientId) {
      // Se precisássemos filtrar por lead_id que vem da tabela sales
    }

    console.log('[installmentService] ✅ Parcelas processadas:', filtered.length);
    return filtered;

  } catch (error) {
    console.error('[installmentService] ❌ ERRO crítico:', error);
    throw error;
  }
};

export const updateInstallmentStatus = async (
  installmentId: string,
  newStatus: string,
  paidDate?: string,
  paymentMethod?: string
) => {
  console.log('[installmentService] 📝 Atualizando status da parcela');
  console.log('[installmentService] Installment ID:', installmentId);
  console.log('[installmentService] Novo status:', newStatus);
  console.log('[installmentService] Data de pagamento:', paidDate);
  console.log('');

  try {
    const updateData: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'pago') {
      updateData.paid_date = paidDate || new Date().toISOString().split('T')[0];
    } else {
      updateData.paid_date = null;
    }

    if (paymentMethod) {
      updateData.payment_method = paymentMethod;
    }

    const { data, error } = await supabase
      .from('sale_installments')
      .update(updateData)
      .eq('id', installmentId)
      .select();

    if (error) {
      console.error('[installmentService] ❌ ERRO ao atualizar:', error);
      throw error;
    }

    console.log('[installmentService] ✅ Parcela atualizada com sucesso');
    return data[0];

  } catch (error) {
    console.error('[installmentService] ❌ ERRO crítico:', error);
    throw error;
  }
};

export const getInstallmentStats = async (organizationId: string) => {
  console.log('[installmentService] 📊 Calculando estatísticas de parcelas');

  try {
    const { data: allInstallments, error } = await supabase
      .from('sale_installments')
      .select('amount, status, due_date')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const stats = {
      total_parcelas: allInstallments?.length || 0,
      parcelas_pagas: allInstallments?.filter(i => i.status === 'pago').length || 0,
      parcelas_pendentes: allInstallments?.filter(i => i.status === 'pendente').length || 0,
      parcelas_atrasadas: allInstallments?.filter(i => i.status === 'atrasado').length || 0,
      valor_total: allInstallments?.reduce((acc, i) => acc + (i.amount || 0), 0) || 0,
      valor_pago: allInstallments?.filter(i => i.status === 'pago').reduce((acc, i) => acc + (i.amount || 0), 0) || 0,
      valor_pendente: allInstallments?.filter(i => i.status !== 'pago').reduce((acc, i) => acc + (i.amount || 0), 0) || 0,
    };

    console.log('[installmentService] ✅ Estatísticas calculadas:', stats);
    return stats;

  } catch (error) {
    console.error('[installmentService] ❌ ERRO ao calcular stats:', error);
    throw error;
  }
};
