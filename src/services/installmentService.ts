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
  console.log('');
  console.log('[installmentService] 📋 INICIANDO busca de parcelas');
  console.log('[installmentService] Organization ID:', organizationId);
  console.log('[installmentService] Filtros aplicados:', filters);
  console.log('');

  try {
    // BUSCA 1: Todas as parcelas sem filtro
    console.log('[installmentService] 🔍 PASSO 1: Buscando TODAS as parcelas (sem filtro)...');
    
    // Usamos lead_id em vez de client_id pois é o nome real da coluna na tabela sales
    const { data: allInstallments, error: allError } = await supabase
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
          id,
          lead_id,
          product_id,
          leads:lead_id(id, name, email),
          products:product_id(id, name)
        )
      `)
      .eq('organization_id', organizationId);

    if (allError) {
      console.error('[installmentService] ❌ ERRO ao buscar todas as parcelas:', allError);
      throw allError;
    }

    console.log('[installmentService] ✅ Total de parcelas encontradas (sem filtro):', allInstallments?.length || 0);
    
    if (allInstallments && allInstallments.length > 0) {
      console.log('[installmentService] Primeiras 3 parcelas:');
      allInstallments.slice(0, 3).forEach((inst, idx) => {
        console.log(`[${idx}] ID: ${inst.id}, Status: ${inst.status}, Sale ID: ${inst.sale_id}`);
      });
    } else {
      console.log('[installmentService] ⚠️ Nenhuma parcela encontrada no banco');
    }
    console.log('');

    // BUSCA 2: Aplicar filtros se fornecidos
    let filteredInstallments = allInstallments || [];

    if (filters?.status && filters.status !== 'todos') {
      console.log('[installmentService] 🔍 PASSO 2: Filtrando por status:', filters.status);
      filteredInstallments = filteredInstallments.filter(inst => inst.status === filters.status);
      console.log('[installmentService] ✅ Parcelas após filtro de status:', filteredInstallments.length);
      console.log('');
    }

    if (filters?.clientId) {
      console.log('[installmentService] 🔍 PASSO 3: Filtrando por cliente:', filters.clientId);
      filteredInstallments = filteredInstallments.filter(inst => (inst.sales as any)?.lead_id === filters.clientId);
      console.log('[installmentService] ✅ Parcelas após filtro de cliente:', filteredInstallments.length);
      console.log('');
    }

    if (filters?.productId) {
      console.log('[installmentService] 🔍 PASSO 4: Filtrando por produto:', filters.productId);
      filteredInstallments = filteredInstallments.filter(inst => (inst.sales as any)?.product_id === filters.productId);
      console.log('[installmentService] ✅ Parcelas após filtro de produto:', filteredInstallments.length);
      console.log('');
    }

    // PROCESSAR DADOS
    console.log('[installmentService] 🔄 PASSO 5: Processando dados das parcelas...');
    const processedInstallments: Installment[] = filteredInstallments.map(inst => {
      const salesData = inst.sales as any;
      const daysOverdue = inst.status === 'atrasado' 
        ? Math.floor((new Date().getTime() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

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

    console.log('[installmentService] ✅ Parcelas processadas:', processedInstallments.length);
    console.log('[installmentService] ✅ getInstallments finalizado com sucesso');
    console.log('');
    console.log('');

    return processedInstallments;

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
    return data?.[0];

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
      .select('amount, status')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('[installmentService] ❌ ERRO ao buscar stats:', error);
      throw error;
    }

    console.log('[installmentService] ✅ Parcelas para stats:', allInstallments?.length || 0);

    const stats = {
      total_parcelas: allInstallments?.length || 0,
      total_valor: allInstallments?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
      parcelas_pagas: allInstallments?.filter(i => i.status === 'pago').length || 0,
      parcelas_pendentes: allInstallments?.filter(i => i.status === 'pendente').length || 0,
      parcelas_atrasadas: allInstallments?.filter(i => i.status === 'atrasado').length || 0,
      valor_atrasado: allInstallments?.filter(i => i.status === 'atrasado').reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
      valor_pago: allInstallments?.filter(i => i.status === 'pago').reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
      valor_pendente: allInstallments?.filter(i => i.status === 'pendente').reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
    };

    console.log('[installmentService] ✅ Stats calculadas:', stats);
    return stats;

  } catch (error) {
    console.error('[installmentService] ❌ ERRO crítico em stats:', error);
    throw error;
  }
};
