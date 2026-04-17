import { supabase } from '../lib/supabase';

export interface InstallmentItem {
  id: string;
  type: 'venda_unica' | 'mensalidade';
  sale_id?: string;
  subscription_id?: string;
  installment_number?: number;
  due_date: string;
  paid_date: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  client_name: string;
  product_name: string;
  days_overdue: number;
  next_billing_date?: string;
}

export const getInstallments = async (
  organizationId: string,
  filters?: {
    status?: string;
    clientId?: string;
    productId?: string;
    type?: string;
  }
) => {
  console.log('');
  console.log('[installmentService] 📋 INICIANDO busca híbrida (vendas + mensalidades)');
  console.log('[installmentService] Organization ID:', organizationId);
  console.log('[installmentService] Filtros:', filters);
  console.log('');

  try {
    const allItems: InstallmentItem[] = [];

    // BUSCA 1: Parcelas de Vendas Únicas
    if (!filters?.type || filters.type === 'todos' || filters.type === 'venda_unica') {
      console.log('[installmentService] 🔍 PASSO 1: Buscando parcelas de vendas únicas...');
      
      const { data: installments, error: instError } = await supabase
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
          sales!inner(
            id,
            lead_id,
            product_id,
            organization_id,
            leads:lead_id(id, name, email),
            products:product_id(id, name)
          )
        `)
        .eq('sales.organization_id', organizationId);

      if (instError) {
        console.error('[installmentService] ❌ ERRO ao buscar parcelas:', instError);
      } else {
        console.log('[installmentService] ✅ Parcelas encontradas:', installments?.length || 0);

        const processedInstallments: InstallmentItem[] = (installments || []).map(inst => {
          const daysOverdue = inst.status === 'atrasado' 
            ? Math.floor((new Date().getTime() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          const salesData = inst.sales as any;

          return {
            id: inst.id,
            type: 'venda_unica',
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

        allItems.push(...processedInstallments);
        console.log('[installmentService] ✅ Parcelas processadas:', processedInstallments.length);
      }
      console.log('');
    }

    // BUSCA 2: Mensalidades Ativas
    if (!filters?.type || filters.type === 'todos' || filters.type === 'mensalidade') {
      console.log('[installmentService] 🔍 PASSO 2: Buscando mensalidades ativas...');
      
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          lead_id,
          product_id,
          monthly_value,
          status,
          start_date,
          next_billing_date,
          leads:lead_id(id, name, email),
          products:product_id(id, name)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'ativo');

      if (subError) {
        console.error('[installmentService] ❌ ERRO ao buscar mensalidades:', subError);
      } else {
        console.log('[installmentService] ✅ Mensalidades encontradas:', subscriptions?.length || 0);

        const processedSubscriptions: InstallmentItem[] = (subscriptions || []).map(sub => {
          const nextBillingDate = sub.next_billing_date || new Date().toISOString().split('T')[0];
          const daysOverdue = new Date(nextBillingDate) < new Date() 
            ? Math.floor((new Date().getTime() - new Date(nextBillingDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          let status = 'pendente';
          if (daysOverdue > 0) {
            status = 'atrasado';
          }

          return {
            id: sub.id,
            type: 'mensalidade',
            subscription_id: sub.id,
            due_date: nextBillingDate,
            paid_date: null,
            amount: sub.monthly_value || 0,
            status: status,
            payment_method: null,
            client_name: sub.leads?.name || 'Desconhecido',
            product_name: sub.products?.name || 'Desconhecido',
            days_overdue: daysOverdue,
            next_billing_date: nextBillingDate,
          };
        });

        allItems.push(...processedSubscriptions);
        console.log('[installmentService] ✅ Mensalidades processadas:', processedSubscriptions.length);
      }
      console.log('');
    }

    // APLICAR FILTROS
    console.log('[installmentService] 🔄 PASSO 3: Aplicando filtros adicionais...');
    let filteredItems = allItems;

    if (filters?.status && filters.status !== 'todos') {
      console.log('[installmentService] 📌 Filtrando por status:', filters.status);
      filteredItems = filteredItems.filter(item => item.status === filters.status);
    }

    // Nota: Filtros de cliente e produto já poderiam ter sido aplicados na query, 
    // mas para manter a lógica híbrida simples fazemos aqui se necessário.
    // No entanto, as queries acima já estão pegando tudo da org.
    
    if (filters?.clientId) {
      // Logic for filtering by client
    }

    // ORDENAR por data de vencimento
    filteredItems.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    console.log('[installmentService] ✅ Total de itens após filtros:', filteredItems.length);
    return filteredItems;

  } catch (error) {
    console.error('[installmentService] ❌ ERRO crítico:', error);
    throw error;
  }
};

export const getInstallmentStats = async (organizationId: string) => {
  console.log('[installmentService] 📊 Calculando estatísticas híbridas');

  try {
    const { data: installments } = await supabase
      .from('sale_installments')
      .select('amount, status, sales!inner(organization_id)')
      .eq('sales.organization_id', organizationId);

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('monthly_value, status')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo');

    const allInstallments = installments || [];
    const allSubscriptions = subscriptions || [];

    const stats = {
      total_parcelas: allInstallments.length,
      total_mensalidades: allSubscriptions.length,
      total_itens: allInstallments.length + allSubscriptions.length,
      
      total_valor_parcelas: allInstallments.reduce((sum, i) => sum + (i.amount || 0), 0),
      total_valor_mensalidades: allSubscriptions.reduce((sum, s) => sum + (s.monthly_value || 0), 0),
      total_valor: (allInstallments.reduce((sum, i) => sum + (i.amount || 0), 0) + 
                    allSubscriptions.reduce((sum, s) => sum + (s.monthly_value || 0), 0)),
      
      parcelas_pagas: allInstallments.filter(i => i.status === 'pago').length,
      parcelas_pendentes: allInstallments.filter(i => i.status === 'pendente').length,
      parcelas_atrasadas: allInstallments.filter(i => i.status === 'atrasado').length,
      valor_atrasado: allInstallments.filter(i => i.status === 'atrasado').reduce((sum, i) => sum + (i.amount || 0), 0),
      
      mensalidades_ativas: allSubscriptions.filter(s => s.status === 'ativo').length,
      mrr: allSubscriptions.reduce((sum, s) => sum + (s.monthly_value || 0), 0),
      
      // Adicionando campos esperados pelo componente para não quebrar a UI
      valor_pago: allInstallments.filter(i => i.status === 'pago').reduce((sum, i) => sum + (i.amount || 0), 0),
      valor_pendente: allInstallments.filter(i => i.status === 'pendente').reduce((sum, i) => sum + (i.amount || 0), 0) + 
                     allSubscriptions.reduce((sum, s) => sum + (s.monthly_value || 0), 0),
    };

    return stats;

  } catch (error) {
    console.error('[installmentService] ❌ ERRO em stats:', error);
    throw error;
  }
};

export const updateInstallmentStatus = async (
  itemId: string,
  newStatus: string,
  paidDate?: string,
  paymentMethod?: string,
  itemType: 'venda_unica' | 'mensalidade' = 'venda_unica'
) => {
  console.log('[installmentService] 📝 Atualizando status do item');
  
  try {
    if (itemType === 'venda_unica') {
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
        .eq('id', itemId)
        .select();

      if (error) throw error;
      return data?.[0];
    } else {
      // Para mensalidades, poderíamos atualizar a próxima data de cobrança ou registrar um pagamento
      // Por simplicidade neste MVP, apenas logamos, já que o modal foca em parcelas de vendas
      console.log('[installmentService] Mensalidade selecionada para atualização - Funcionalidade em desenvolvimento');
      return null;
    }
  } catch (error) {
    console.error('[installmentService] ❌ ERRO ao atualizar:', error);
    throw error;
  }
};
