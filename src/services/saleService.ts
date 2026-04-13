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
    let salesQuery = supabase
      .from('sales')
      .select(`
        id,
        lead_id,
        leads(name, email),
        product_id,
        payment_method,
        status,
        created_at,
        updated_at,
        discount_type,
        discount_value,
        discount_description,
        original_amount,
        final_amount
      `);
    
    if (organizationId !== 'consolidado') {
      salesQuery = salesQuery.eq('organization_id', organizationId);
    }
    
    const { data: salesData, error: salesError } = await salesQuery
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
    let subscriptionsQuery = supabase
      .from('subscriptions')
      .select(`
        id,
        client_id,
        leads(name, email),
        sales_stage_id,
        monthly_value,
        payment_method_id,
        payment_methods(name),
        status,
        created_at,
        updated_at
      `);
    
    if (organizationId !== 'consolidado') {
      subscriptionsQuery = subscriptionsQuery.eq('organization_id', organizationId);
    }
    
    const { data: subscriptionsData, error: subscriptionsError } = await subscriptionsQuery
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
        client_email: sale.leads?.email || '',
        product_id: sale.product_id,
        sales_stage_id: sale.product_id,
        stage_name: stage?.name || 'Etapa desconhecida',
        stage_value: Number(sale.final_amount || stage?.value || 0),
        original_amount: Number(sale.original_amount || stage?.value || 0),
        final_amount: Number(sale.final_amount || stage?.value || 0),
        discount_type: sale.discount_type,
        discount_value: sale.discount_value,
        discount_description: sale.discount_description,
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
        client_email: sub.leads?.email || '',
        sales_stage_id: sub.sales_stage_id,
        product_id: sub.sales_stage_id,
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
    let salesQuery = supabase
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
      .eq('lead_id', clientId);
    
    if (organizationId !== 'consolidado') {
      salesQuery = salesQuery.eq('organization_id', organizationId);
    }
    
    const { data: salesData, error: salesError } = await salesQuery
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
    let subscriptionsQuery = supabase
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
      .eq('client_id', clientId);
    
    if (organizationId !== 'consolidado') {
      subscriptionsQuery = subscriptionsQuery.eq('organization_id', organizationId);
    }
    
    const { data: subscriptionsData, error: subscriptionsError } = await subscriptionsQuery
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

const createUniqueSale = async (organizationId: string, saleData: any) => {
  console.log('[SaleService] Criando venda única...');
  
  // Buscar valor da etapa
  const { data: stage } = await supabase
    .from('product_sales_stages')
    .select('value')
    .eq('id', saleData.sales_stage_id)
    .single();

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      organization_id: organizationId,
      lead_id: saleData.client_id,
      product_id: saleData.sales_stage_id,
      value: stage?.value || 0,
      status: 'pendente',
      payment_method: saleData.payment_method_id,
      notes: saleData.notes,
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // Criar parcelas
  if (saleData.installments && saleData.installments > 0) {
    const installmentRecords = [];
    const installmentAmount = (stage?.value || 0) / saleData.installments;
    const firstPaymentDate = new Date(saleData.first_payment_due_date || new Date());

    for (let i = 1; i <= saleData.installments; i++) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      installmentRecords.push({
        sale_id: sale.id,
        organization_id: organizationId,
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: parseFloat(installmentAmount.toFixed(2)),
        status: 'pendente',
        auto_payment_enabled: saleData.auto_payment_enabled,
      });
    }

    const { error: installmentsError } = await supabase
      .from('sale_installments')
      .insert(installmentRecords);

    if (installmentsError) throw installmentsError;
  }

  return sale;
};

const createSubscriptionSale = async (organizationId: string, saleData: any) => {
  console.log('[SaleService] Criando mensalidade...');
  
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions' as any)
    .insert({
      organization_id: organizationId,
      client_id: saleData.client_id,
      sales_stage_id: saleData.sales_stage_id,
      monthly_value: saleData.monthly_value,
      start_date: saleData.start_date || new Date().toISOString(),
      end_date: saleData.end_date,
      status: 'ativa',
      payment_method_id: saleData.payment_method_id,
      auto_payment_enabled: saleData.auto_payment_enabled,
      notes: saleData.notes || '',
    })
    .select()
    .single();

  if (subscriptionError) throw subscriptionError;

  // Criar primeira parcela
  const { error: paymentError } = await supabase
    .from('subscription_payments')
    .insert({
      subscription_id: (subscription as any).id,
      organization_id: organizationId,
      payment_number: 1,
      due_date: saleData.first_payment_due_date || new Date().toISOString(),
      amount: saleData.monthly_value,
      status: 'pendente',
      auto_payment_enabled: saleData.auto_payment_enabled,
    });

  if (paymentError) throw paymentError;

  return subscription;
};

export const createSale = async (
  organizationId: string,
  saleData: {
    client_id: string;
    sales_stage_id: string;
    sale_type: 'unica' | 'mensalidade';
    monthly_value?: number;
    installments?: number;
    start_date?: string;
    end_date?: string;
    first_payment_due_date?: string;
    payment_method_id: string;
    auto_payment_enabled: boolean;
    notes?: string;
  }
) => {
  try {
    console.log('[SaleService] Criando venda:', {
      sale_type: saleData.sale_type,
      client_id: saleData.client_id,
    });

    let sale;

    // VENDA ÚNICA: criar em sales + sale_installments
    if (saleData.sale_type === 'unica') {
      sale = await createUniqueSale(organizationId, saleData);
    }

    // MENSALIDADE: criar em subscriptions + subscription_payments
    if (saleData.sale_type === 'mensalidade') {
      sale = await createSubscriptionSale(organizationId, saleData);
    }

    // ✨ NOVO: Converter lead em cliente e criar relacionamento com produto
    console.log('[SaleService] Convertendo lead em cliente e registrando produto...');
    await convertLeadToClient(saleData.client_id, organizationId);
    
    // Obter o product_id real da etapa de venda
    const { data: stage } = await supabase
      .from('product_sales_stages')
      .select('product_id')
      .eq('id', saleData.sales_stage_id)
      .single();

    if (stage?.product_id) {
      // Registrar na tabela client_products para visibilidade nos dashboards
      await supabase
        .from('client_products')
        .upsert({
          organization_id: organizationId,
          client_id: saleData.client_id,
          product_id: stage.product_id,
          payment_status: saleData.sale_type === 'mensalidade' ? 'ATIVO' : 'PENDENTE',
          start_date: new Date().toISOString().split('T')[0],
          plan_type: saleData.sale_type === 'mensalidade' ? 'MENSAL' : 'AVULSO',
        }, { onConflict: 'client_id,product_id' });
    }

    console.log('[SaleService] ✅ Venda criada e lead convertido em cliente');
    return sale;
  } catch (error) {
    console.error('[SaleService] ❌ Erro ao criar venda:', error);
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

    // PASSO 1: Buscar dados completos do lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .single();

    if (leadError) {
      console.error('[SaleService] ❌ Erro ao buscar lead:', leadError.message);
      throw leadError;
    }

    // PASSO 2: Atualizar flag is_client no lead (se ainda não for)
    if (!leadData?.is_client) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          is_client: true,
          became_client_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
    }

    // PASSO 3: Upsert na tabela 'clients' para manter compatibilidade
    const { error: clientUpsertError } = await supabase
      .from('clients')
      .upsert({
        id: leadId,
        organization_id: organizationId,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (clientUpsertError) {
      console.error('[SaleService] ❌ Erro ao sincronizar tabela clients:', clientUpsertError.message);
      throw clientUpsertError;
    }

    console.log('[SaleService] ✅ Lead convertido e sincronizado na tabela clients');
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao converter lead:', error);
    throw error;
  }
};
