import { supabase } from '@/integrations/supabase/client';

export const getSaleById = async (
  saleId: string,
  saleType: 'unica' | 'mensalidade'
) => {
  try {
    console.log('[SaleService] Iniciando busca de venda:', {
      saleId,
      saleType,
      timestamp: new Date().toISOString(),
    });

    if (!saleId || !saleType) {
      throw new Error('saleId ou saleType inválidos');
    }

    if (saleType === 'unica') {
      console.log('[SaleService] Buscando venda única...');

      // Query simplificada para debug
      const { data, error, status } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (error) {
        console.error('[SaleService] ❌ Erro na query principal (unica):', {
          error: error.message,
          code: error.code,
          status,
        });
        throw new Error(`Erro ao buscar venda: ${error.message}`);
      }

      if (!data) {
        console.error('[SaleService] ❌ Venda não encontrada no banco');
        throw new Error('Venda não encontrada');
      }

      console.log('[SaleService] ✅ Venda única encontrada:', data.id);

      // Agora buscar relacionamentos
      // Adaptar para colunas reais: lead_id, product_id, payment_method
      const { data: clientData } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('id', data.lead_id)
        .maybeSingle();

      const { data: stageData } = await supabase
        .from('product_sales_stages')
        .select('id, stage_name, stage_value, sale_type')
        .eq('id', data.product_id)
        .maybeSingle();

      // Para sales, payment_method é um texto. Tentamos encontrar por nome na tabela payment_methods
      let paymentData = null;
      if (data.payment_method) {
        const { data: pData } = await supabase
          .from('payment_methods')
          .select('id, name')
          .eq('name', data.payment_method)
          .maybeSingle();
        paymentData = pData || { id: null, name: data.payment_method };
      }

      const fullData = {
        ...data,
        client_id: data.lead_id, // Unificar com subscriptions
        sales_stage_id: data.product_id, // Unificar com subscriptions
        payment_method_id: paymentData?.id || null,
        leads: clientData,
        product_sales_stages: stageData,
        payment_methods: paymentData,
      };

      console.log('[SaleService] ✅ Venda única com relacionamentos carregada');
      return fullData;
    } else {
      console.log('[SaleService] Buscando mensalidade...');

      // Query simplificada para debug
      const { data, error, status } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', saleId)
        .single();

      if (error) {
        console.error('[SaleService] ❌ Erro na query principal (mensalidade):', {
          error: error.message,
          code: error.code,
          status,
        });
        throw new Error(`Erro ao buscar mensalidade: ${error.message}`);
      }

      if (!data) {
        console.error('[SaleService] ❌ Mensalidade não encontrada no banco');
        throw new Error('Mensalidade não encontrada');
      }

      console.log('[SaleService] ✅ Mensalidade encontrada:', data.id);

      // Agora buscar relacionamentos
      // Adaptar para colunas reais: client_id, sales_stage_id, payment_method_id
      const { data: clientData } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('id', data.client_id)
        .maybeSingle();

      const { data: stageData } = await supabase
        .from('product_sales_stages')
        .select('id, stage_name, stage_value, sale_type')
        .eq('id', data.sales_stage_id)
        .maybeSingle();

      const { data: paymentData } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('id', data.payment_method_id)
        .maybeSingle();

      const fullData = {
        ...data,
        leads: clientData,
        product_sales_stages: stageData,
        payment_methods: paymentData,
      };

      console.log('[SaleService] ✅ Mensalidade com relacionamentos carregada');
      return fullData;
    }
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao buscar venda:', {
      error: error instanceof Error ? error.message : String(error),
      saleId,
      saleType,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export const updateSale = async (
  saleId: string,
  saleType: 'unica' | 'mensalidade',
  data: any
) => {
  try {
    console.log('[SaleService] Iniciando atualização:', { saleId, saleType, data });
    
    const table = saleType === 'unica' ? 'sales' : 'subscriptions';
    const updateData: any = { ...data, updated_at: new Date().toISOString() };
    
    // Mapear campos para a tabela 'sales' (unica)
    if (saleType === 'unica') {
      // Se tiver payment_method_id (UUID), tentar buscar o nome para salvar no campo de texto payment_method
      if (data.payment_method_id) {
        try {
          const { data: pm } = await supabase
            .from('payment_methods')
            .select('name')
            .eq('id', data.payment_method_id)
            .maybeSingle();
          
          if (pm) {
            updateData.payment_method = pm.name;
          } else {
            updateData.payment_method = data.payment_method_id; // Fallback para o valor original se não encontrar
          }
        } catch (pmErr) {
          console.warn('[SaleService] Erro ao buscar nome do método de pagamento:', pmErr);
          updateData.payment_method = data.payment_method_id;
        }
      } else if (data.payment_method_id === null || data.payment_method_id === '') {
        updateData.payment_method = null;
      }
      
      delete updateData.payment_method_id;
    }

    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', saleId);

    if (error) {
      console.error(`[SaleService] ❌ Erro ao atualizar ${table}:`, error);
      throw new Error(`Erro ao atualizar: ${error.message}`);
    }

    console.log(`[SaleService] ✅ ${table} atualizada com sucesso`);
    return true;
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao atualizar:', error);
    throw error;
  }
};

export const deleteSale = async (
  saleId: string,
  saleType: 'unica' | 'mensalidade'
) => {
  try {
    console.log('[SaleService] Deletando venda:', { saleId, saleType });

    if (saleType === 'unica') {
      // Verificar se há parcelas pagas
      const { data: paidInstallments, error: checkError } = await supabase
        .from('sale_installments')
        .select('id')
        .eq('sale_id', saleId)
        .eq('status', 'pago');

      if (checkError) throw checkError;
      if (paidInstallments && paidInstallments.length > 0) {
        throw new Error('Não é possível excluir uma venda que possui parcelas pagas.');
      }

      // Deletar parcelas primeiro
      const { error: installmentsError } = await supabase
        .from('sale_installments')
        .delete()
        .eq('sale_id', saleId);

      if (installmentsError) throw installmentsError;

      // Depois deletar venda
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (saleError) throw saleError;
    } else {
      // Verificar se há pagamentos realizados
      const { data: paidPayments, error: checkError } = await supabase
        .from('subscription_payments')
        .select('id')
        .eq('subscription_id', saleId)
        .eq('status', 'pago');

      if (checkError) throw checkError;
      if (paidPayments && paidPayments.length > 0) {
        throw new Error('Não é possível excluir uma mensalidade que possui pagamentos confirmados.');
      }

      // Deletar parcelas de mensalidade primeiro
      const { error: paymentsError } = await supabase
        .from('subscription_payments')
        .delete()
        .eq('subscription_id', saleId);

      if (paymentsError) throw paymentsError;

      // Depois deletar mensalidade
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', saleId);

      if (subscriptionError) throw subscriptionError;
    }

    console.log('[SaleService] ✅ Venda deletada com sucesso');
  } catch (error) {
    console.error('[SaleService] ❌ Erro ao deletar venda:', error);
    throw error;
  }
};

export const getSalesAndSubscriptions = async (organizationId: string) => {
  try {
    console.log('[SaleService] Buscando vendas e mensalidades para org:', organizationId);

    // PASSO 1: Buscar vendas únicas com relacionamentos corretos
    // Em 'sales', client_id mapeia para 'lead_id' e sales_stage_id para 'product_id'
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        lead_id,
        leads(name),
        product_id,
        payment_method,
        status,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('[SaleService] ❌ Erro ao buscar vendas:', salesError.message);
      throw new Error(`Erro ao buscar vendas: ${salesError.message}`);
    }

    console.log('[SaleService] ✅ Vendas carregadas:', salesData?.length || 0);

    // PASSO 2: Buscar etapas de venda para obter nomes e valores
    // As colunas reais na tabela são 'name' e 'value'
    const { data: stagesData, error: stagesError } = await supabase
      .from('product_sales_stages')
      .select('id, name, value, sale_type');

    if (stagesError) {
      console.error('[SaleService] ❌ Erro ao buscar etapas:', stagesError.message);
      throw new Error(`Erro ao buscar etapas: ${stagesError.message}`);
    }

    console.log('[SaleService] ✅ Etapas carregadas:', stagesData?.length || 0);

    // PASSO 3: Buscar mensalidades
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        client_id,
        leads(name),
        sales_stage_id,
        monthly_value,
        payment_method_id,
        payment_methods(name),
        status,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error('[SaleService] ❌ Erro ao buscar mensalidades:', subscriptionsError.message);
      throw new Error(`Erro ao buscar mensalidades: ${subscriptionsError.message}`);
    }

    console.log('[SaleService] ✅ Mensalidades carregadas:', subscriptionsData?.length || 0);

    // PASSO 4: Criar mapa de etapas para lookup rápido
    const stagesMap = new Map();
    (stagesData || []).forEach(stage => {
      stagesMap.set(stage.id, stage);
    });

    // PASSO 5: Transformar vendas únicas com dados de etapas
    const formattedSales = (salesData || []).map((sale: any) => {
      const stage = stagesMap.get(sale.product_id);
      return {
        id: sale.id,
        client_id: sale.lead_id,
        client_name: sale.leads?.name || 'Cliente desconhecido',
        sales_stage_id: sale.product_id,
        stage_name: stage?.name || 'Etapa desconhecida',
        stage_value: Number(stage?.value || 0),
        sale_type: 'unica' as const,
        payment_method_id: sale.payment_method,
        payment_method_name: sale.payment_method || 'Não definida',
        status: sale.status,
        created_at: sale.created_at,
        updated_at: sale.updated_at,
      };
    });

    // PASSO 6: Transformar mensalidades com dados de etapas
    const formattedSubscriptions = (subscriptionsData || []).map((sub: any) => {
      const stage = stagesMap.get(sub.sales_stage_id);
      return {
        id: sub.id,
        client_id: sub.client_id,
        client_name: sub.leads?.name || 'Cliente desconhecido',
        sales_stage_id: sub.sales_stage_id,
        stage_name: stage?.name || 'Etapa desconhecida',
        stage_value: Number(sub.monthly_value || 0),
        sale_type: 'mensalidade' as const,
        payment_method_id: sub.payment_method_id,
        payment_method_name: sub.payment_methods?.name || 'Não definida',
        status: sub.status,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
      };
    });

    // PASSO 7: Combinar e ordenar
    const allSales = [...formattedSales, ...formattedSubscriptions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('[SaleService] ✅ Total de vendas:', allSales.length);
    return allSales;
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao buscar vendas:', error);
    throw error;
  }
};

export const getClientSales = async (
  organizationId: string,
  clientId: string
) => {
  try {
    console.log('[SaleService] Buscando vendas do cliente:', {
      organizationId,
      clientId,
    });

    // PASSO 1: Buscar vendas únicas do cliente
    // Corrigido: lead_id e product_id para a tabela 'sales'
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        lead_id,
        product_id,
        payment_method,
        status,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .eq('lead_id', clientId)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('[SaleService] ❌ Erro ao buscar vendas do cliente:', salesError.message);
      throw new Error(`Erro ao buscar vendas: ${salesError.message}`);
    }

    console.log('[SaleService] ✅ Vendas do cliente carregadas:', salesData?.length || 0);

    // PASSO 2: Buscar etapas de venda
    // Corrigido: name e value para 'product_sales_stages'
    const { data: stagesData, error: stagesError } = await supabase
      .from('product_sales_stages')
      .select('id, name, value, sale_type');

    if (stagesError) {
      console.error('[SaleService] ❌ Erro ao buscar etapas:', stagesError.message);
      throw new Error(`Erro ao buscar etapas: ${stagesError.message}`);
    }

    console.log('[SaleService] ✅ Etapas carregadas:', stagesData?.length || 0);

    // PASSO 3: Buscar mensalidades do cliente
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        client_id,
        sales_stage_id,
        monthly_value,
        payment_method_id,
        payment_methods(name),
        status,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error('[SaleService] ❌ Erro ao buscar mensalidades:', subscriptionsError.message);
      throw new Error(`Erro ao buscar mensalidades: ${subscriptionsError.message}`);
    }

    console.log('[SaleService] ✅ Mensalidades do cliente carregadas:', subscriptionsData?.length || 0);

    // PASSO 4: Criar mapa de etapas para lookup
    const stagesMap = new Map();
    (stagesData || []).forEach(stage => {
      stagesMap.set(stage.id, stage);
    });

    // PASSO 5: Transformar vendas únicas
    const formattedSales = (salesData || []).map((sale: any) => {
      const stage = stagesMap.get(sale.product_id);
      return {
        id: sale.id,
        client_id: sale.lead_id,
        sales_stage_id: sale.product_id,
        stage_name: stage?.name || 'Etapa desconhecida',
        stage_value: Number(stage?.value || 0),
        sale_type: 'unica' as const,
        payment_method_id: null,
        payment_method_name: sale.payment_method || 'Não definida',
        status: sale.status,
        created_at: sale.created_at,
        updated_at: sale.updated_at,
      };
    });

    // PASSO 6: Transformar mensalidades
    const formattedSubscriptions = (subscriptionsData || []).map((sub: any) => {
      const stage = stagesMap.get(sub.sales_stage_id);
      return {
        id: sub.id,
        client_id: sub.client_id,
        sales_stage_id: sub.sales_stage_id,
        stage_name: stage?.name || 'Etapa desconhecida',
        stage_value: Number(sub.monthly_value || 0),
        sale_type: 'mensalidade' as const,
        payment_method_id: sub.payment_method_id,
        payment_method_name: sub.payment_methods?.name || 'Não definida',
        status: sub.status,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
      };
    });

    // PASSO 7: Combinar e ordenar
    const allSales = [...formattedSales, ...formattedSubscriptions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('[SaleService] ✅ Total de vendas do cliente:', allSales.length);
    return allSales;
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao buscar vendas do cliente:', error);
    throw error;
  }
};

export const convertLeadToClient = async (
  leadId: string,
  organizationId: string
) => {
  try {
    console.log('[SaleService] Convertendo lead em cliente:', {
      leadId,
      organizationId,
    });

    // PASSO 1: Verificar se lead já é cliente
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('is_client, became_client_at')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .single();

    if (leadError) {
      console.error('[SaleService] ❌ Erro ao buscar lead:', leadError.message);
      throw leadError;
    }

    // Se já é cliente, não fazer nada
    if (leadData?.is_client) {
      console.log('[SaleService] ℹ️ Lead já é cliente');
      return;
    }

    // PASSO 2: Converter lead em cliente
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        is_client: true,
        became_client_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('[SaleService] ❌ Erro ao converter lead:', updateError.message);
      throw updateError;
    }

    console.log('[SaleService] ✅ Lead convertido em cliente com sucesso');
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao converter lead:', error);
    throw error;
  }
};
