import { supabase } from '@/integrations/supabase/client';

export const convertLeadToClient = async (leadId: string, organizationId: string) => {
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      is_client: true,
      became_client_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (updateError) throw updateError;

  const { data: leadData } = await supabase
    .from('leads')
    .select('name, email, phone')
    .eq('id', leadId)
    .single();

  if (leadData) {
    await supabase
      .from('clients')
      .upsert({
        id: leadId,
        organization_id: organizationId,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
  }
};

interface CreateSaleInput {
  client_id: string;
  product_id?: string; // Adicionado product_id no topo
  value: number;
  status: string;
  installments: number;
  first_payment_date: string;
  auto_payment_enabled: boolean;
  notes?: string;
  payment_method_id?: string;
  initial_payment?: number;
  sales_stage_id?: string;
  discount_type?: string;
  discount_value?: number;
  discount_description?: string;
  original_amount?: number;
  final_amount?: number;
  discount_granted_by?: string;
  discount_granted_at?: string;
  items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const saveVenda = async (
  organizationId: string,
  vendaData: {
    client_name: string;
    client_email: string;
    product_id: string;
    amount: number;
    [key: string]: any;
  }
): Promise<any> => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[salesService] 🚀 INICIANDO saveVenda');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[salesService] Timestamp:', new Date().toISOString());
    console.log('[salesService] Organization ID:', organizationId);
    console.log('[salesService] Dados recebidos:', JSON.stringify(vendaData, null, 2));
    console.log('');

    // PASSO 1: Validar organizationId
    if (!organizationId || organizationId.trim() === '') {
      console.error('[salesService] ❌ ERRO: organizationId vazio');
      throw new Error('Organization ID é obrigatório');
    }
    console.log('[salesService] ✅ PASSO 1: organizationId válido');

    // PASSO 2: Buscar lead existente (se lead_id foi fornecido)
    let leadId = vendaData.lead_id || null;
    
    if (vendaData.client_email && !leadId) {
      console.log('[salesService] 📍 PASSO 2: Buscando lead por email...');
      console.log('[salesService] Email:', vendaData.client_email);

      const { data: existingLead, error: leadError } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', vendaData.client_email)
        .single();

      if (leadError && leadError.code !== 'PGRST116') {
        console.error('[salesService] ❌ ERRO ao buscar lead:', leadError);
        console.error('[salesService] Detalhes:', {
          code: leadError.code,
          message: leadError.message,
        });
        throw leadError;
      }

      if (existingLead) {
        leadId = existingLead.id;
        console.log('[salesService] ✅ Lead encontrado:', leadId);
      } else {
        console.log('[salesService] ℹ️ Lead não encontrado, será criado novo');
      }
    }

    // PASSO 3: Preparar dados para INSERT
    console.log('[salesService] 📍 PASSO 3: Preparando dados para INSERT...');

    const saleData = {
      organization_id: organizationId,
      lead_id: leadId,
      product_id: vendaData.product_id || null,
      sale_date: new Date().toISOString().split('T')[0],
      status: vendaData.status || 'pending',
      client_email: vendaData.client_email || '',
      payment_method: vendaData.payment_method || null,
      notes: vendaData.notes || '',
      discount_type: vendaData.discount_type || 'none',
      discount_value: vendaData.discount_value || 0,
      discount_description: vendaData.discount_description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[salesService] Dados preparados:', JSON.stringify(saleData, null, 2));

    // PASSO 4: Inserir venda
    console.log('[salesService] 📍 PASSO 4: Inserindo venda no Supabase...');
    console.log('[salesService] 📡 Enviando POST para /sales');

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([saleData])
      .select('*')
      .single();

    if (saleError) {
      console.error('[salesService] ❌ ERRO ao inserir venda:', saleError);
      console.error('[salesService] Código do erro:', saleError.code);
      console.error('[salesService] Mensagem:', saleError.message);
      console.error('[salesService] Detalhes completos:', {
        code: saleError.code,
        message: saleError.message,
        details: saleError.details,
        hint: saleError.hint,
      });
      throw saleError;
    }

    console.log('[salesService] ✅ Venda inserida com sucesso!');
    console.log('[salesService] ID da venda:', sale.id);
    console.log('[salesService] Dados salvos:', JSON.stringify(sale, null, 2));

    // PASSO 5: Verificar se foi realmente salva
    console.log('[salesService] 📍 PASSO 5: Verificando se venda foi salva...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('sales')
      .select('id, value, status')
      .eq('id', sale.id)
      .single();

    if (verifyError) {
      console.error('[salesService] ⚠️ AVISO: Não consegui verificar venda:', verifyError);
    } else {
      console.log('[salesService] ✅ VERIFICAÇÃO: Venda confirmada no banco:', verifyData);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[salesService] ✅ SUCESSO: saveVenda completado');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    return sale;

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[salesService] ❌ ERRO CRÍTICO em saveVenda');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[salesService] Tipo de erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[salesService] Mensagem:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('[salesService] Stack trace:', error.stack);
    }
    console.error('[salesService] Objeto completo:', error);
    console.error('');
    throw error;
  }
};

export const createSaleWithInstallments = async (organizationId: string, saleData: CreateSaleInput) => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SalesService] 🚀 INICIANDO createSaleWithInstallments');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SalesService] Timestamp:', new Date().toISOString());
    console.log('[SalesService] Organization ID:', organizationId);
    console.log('[SalesService] Dados recebidos:', JSON.stringify(saleData, null, 2));
    console.log('');

    if (!organizationId) {
      console.error('[SalesService] ❌ ERRO: organizationId ausente');
      throw new Error('organizationId ausente');
    }
    if (!saleData.client_id) {
      console.error('[SalesService] ❌ ERRO: client_id ausente');
      throw new Error('client_id ausente');
    }
    if (!saleData.first_payment_date) {
      console.error('[SalesService] ❌ ERRO: first_payment_date ausente');
      throw new Error('first_payment_date ausente');
    }
    if (!Number.isFinite(saleData.value) || saleData.value <= 0) {
      console.error('[SalesService] ❌ ERRO: Valor inválido:', saleData.value);
      throw new Error('Valor inválido');
    }
    if (!Number.isFinite(saleData.installments) || saleData.installments < 1) {
      console.error('[SalesService] ❌ ERRO: Parcelas inválidas:', saleData.installments);
      throw new Error('Parcelas inválidas');
    }

    console.log('[SalesService] ✅ Validações iniciais passaram');

    // Resolver nome do método de pagamento se um ID foi fornecido
    let paymentMethodName = '';
    if (saleData.payment_method_id) {
      console.log('[SalesService] 📍 Buscando nome do método de pagamento:', saleData.payment_method_id);
      const { data: pm, error: pmError } = await supabase
        .from('payment_methods')
        .select('name')
        .eq('id', saleData.payment_method_id)
        .maybeSingle();
      
      if (pmError) {
        console.warn('[SalesService] ⚠️ Aviso ao buscar método de pagamento:', pmError);
      } else if (pm) {
        paymentMethodName = pm.name;
        console.log('[SalesService] ✅ Método de pagamento encontrado:', paymentMethodName);
      }
    }

    // PASSO 1: Criar venda em sales
    console.log('[SalesService] 📍 PASSO 1: Inserindo venda na tabela "sales"...');
    
    const insertData = {
      organization_id: organizationId,
      lead_id: saleData.client_id,
      value: Number(saleData.final_amount) || Number(saleData.value) || 0,
      status: saleData.status || 'ativo',
      notes: saleData.notes,
      payment_method: paymentMethodName || saleData.payment_method_id || '',
      product_id: saleData.product_id || saleData.sales_stage_id || null,
      discount_type: saleData.discount_type,
      discount_value: saleData.discount_value,
      discount_description: saleData.discount_description,
      original_amount: Number(saleData.original_amount) || Number(saleData.value) || 0,
      final_amount: Number(saleData.final_amount) || Number(saleData.value) || 0,
      discount_granted_by: saleData.discount_granted_by,
      discount_granted_at: saleData.discount_granted_at,
      sale_date: new Date().toISOString().split('T')[0],
    };

    console.log('[SalesService] Dados para INSERT:', JSON.stringify(insertData, null, 2));

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(insertData)
      .select()
      .single();

    if (saleError) {
      console.error('[SalesService] ❌ ERRO ao inserir venda:', saleError);
      console.error('[SalesService] Código:', saleError.code);
      console.error('[SalesService] Mensagem:', saleError.message);
      throw saleError;
    }

    console.log('[SalesService] ✅ Venda criada com sucesso! ID:', sale.id);

    // PASSO 2: Calcular e criar parcelas
    console.log('[SalesService] 📍 PASSO 2: Calculando parcelas...');
    const installmentRecords = [];
    const valueToInstall = saleData.value - (saleData.initial_payment || 0);
    const [year, month, day] = saleData.first_payment_date.split('-').map(Number);
    const installmentAmount = valueToInstall / saleData.installments;

    console.log('[SalesService] Detalhes das parcelas:', {
      total_a_parcelar: valueToInstall,
      quantidade: saleData.installments,
      valor_parcela: installmentAmount
    });

    for (let i = 1; i <= saleData.installments; i += 1) {
      const dueDate = new Date(year, month - 1 + (i - 1), day);
      if (dueDate.getDate() !== day) dueDate.setDate(0);

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

    // PASSO 3: Inserir parcelas
    console.log('[SalesService] 📍 PASSO 3: Inserindo parcelas na tabela "sale_installments"...');
    const { error: installmentsError } = await supabase
      .from('sale_installments')
      .insert(installmentRecords);

    if (installmentsError) {
      console.error('[SalesService] ❌ ERRO ao inserir parcelas:', installmentsError);
      throw installmentsError;
    }

    console.log('[SalesService] ✅ Parcelas inseridas com sucesso');

    // Converter lead em cliente
    console.log('[SalesService] 📍 PASSO 4: Convertendo lead em cliente...');
    await convertLeadToClient(saleData.client_id, organizationId);
    console.log('[SalesService] ✅ Lead convertido');

    // ✨ NOVO: Registrar relacionamento com produto se houver
    if (saleData.sales_stage_id) {
      console.log('[SalesService] 📍 PASSO 5: Registrando relacionamento com produto...');
      try {
        // Obter o product_id real da etapa de venda
        const { data: stage, error: stageError } = await supabase
          .from('product_sales_stages')
          .select('product_id')
          .eq('id', saleData.sales_stage_id)
          .single();

        if (stageError) {
          console.warn('[SalesService] ⚠️ Aviso ao buscar etapa do produto:', stageError);
        } else if (stage?.product_id) {
          console.log('[SalesService] Vinculando cliente ao produto:', stage.product_id);
          const { error: cpError } = await supabase
            .from('client_products')
            .upsert({
              organization_id: organizationId,
              client_id: saleData.client_id,
              product_id: stage.product_id,
              payment_status: 'ATIVO',
              start_date: new Date().toISOString().split('T')[0],
              plan_type: 'AVULSO'
            }, { onConflict: 'client_id,product_id' });
          
          if (cpError) {
            console.error('[SalesService] ❌ Erro no upsert de client_products:', cpError);
          } else {
            console.log('[SalesService] ✅ Relacionamento client_product registrado');
          }
        }
      } catch (cpErr) {
        console.warn('[SalesService] ⚠️ Erro inesperado ao registrar client_product:', cpErr);
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('[SalesService] ✅ SUCESSO: Venda finalizada');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    return { sale, installments: installmentRecords };
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[SalesService] ❌ ERRO CRÍTICO ao criar venda');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[SalesService] Detalhes do erro:', error);
    console.error('');
    throw error;
  }
};

export const createUniqueSale = createSaleWithInstallments;
export const createSale = createSaleWithInstallments;

export const deleteSale = async (saleId: string, saleType: 'unica' | 'mensalidade' = 'unica') => {
  try {
    if (saleType === 'unica') {
      // Primeiro excluímos as parcelas
      await supabase.from('sale_installments').delete().eq('sale_id', saleId);
      // Depois a venda
      await supabase.from('sales').delete().eq('id', saleId);
    } else {
      // Deletar parcelas de mensalidade
      await supabase.from('subscription_payments').delete().eq('subscription_id', saleId);
      // Depois a mensalidade
      await supabase.from('subscriptions').delete().eq('id', saleId);
    }
    return true;
  } catch (error) {
    console.error('[SalesService] ❌ Erro ao excluir venda:', error);
    throw error;
  }
};

export const fetchSales = async (
  organizationId: string
): Promise<any[]> => {
  try {
    console.log('[salesService] 📊 Buscando vendas');
    console.log('[salesService] Organization ID:', organizationId);

    // Query com join para obter dados do cliente
    // Como não há FK direta com product_sales_stages, buscamos produtos separadamente ou fazemos join com products
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        leads(name, email),
        products(name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[salesService] ❌ Erro na query:', error);
      throw error;
    }

    // Como sales.product_id pode estar guardando um ID de product_sales_stages,
    // buscamos os nomes das etapas separadamente para maior precisão
    const { data: stages } = await supabase
      .from('product_sales_stages')
      .select('id, name, value');

    const stagesMap = new Map((stages || []).map(s => [s.id, s]));

    // Formatar dados para o frontend
    const formattedSales = (data || []).map(sale => {
      const stage = stagesMap.get(sale.product_id);
      return {
        ...sale,
        client_name: sale.leads?.name || 'Cliente desconhecido',
        client_email: sale.leads?.email || '',
        stage_name: stage?.name || sale.products?.name || 'Etapa não identificada',
        stage_value: stage?.value || sale.value || 0,
        original_amount: sale.original_amount || sale.value || 0,
        final_amount: sale.final_amount || sale.value || 0,
        sale_type: 'unica'
      };
    });

    return formattedSales;

  } catch (error) {
    console.error('[salesService] ❌ Erro geral:', error);
    throw error;
  }
};

export const loadAllSales = async (organizationId: string) => {
  console.log('[salesService] 📊 Buscando vendas E mensalidades');
  console.log('[salesService] Organization ID:', organizationId);

  try {
    // 1. BUSCAR VENDAS ÚNICAS
    const { data: uniqueSalesData, error: uniqueError } = await supabase
      .from('sales')
      .select(`
        *,
        leads(name, email),
        products(name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (uniqueError) {
      console.error('[salesService] ❌ ERRO ao buscar sales:', uniqueError);
    }

    // 2. BUSCAR MENSALIDADES
    const { data: subscriptionsData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        leads:client_id(name, email),
        product_sales_stages(name, value),
        products(name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (subscriptionError) {
      console.error('[salesService] ❌ ERRO ao buscar subscriptions:', subscriptionError);
    }

    // 3. BUSCAR ETAPAS (para vendas únicas que não têm join direto)
    const { data: stages } = await supabase
      .from('product_sales_stages')
      .select('id, name, value');

    const stagesMap = new Map((stages || []).map(s => [s.id, s]));

    // 4. FORMATAR VENDAS ÚNICAS
    const formattedUniqueSales = (uniqueSalesData || []).map(sale => {
      const stage = stagesMap.get(sale.product_id);
      return {
        ...sale,
        client_name: sale.leads?.name || 'Cliente desconhecido',
        client_email: sale.leads?.email || '',
        stage_name: stage?.name || sale.products?.name || 'Venda Única',
        stage_value: stage?.value || sale.value || 0,
        original_amount: sale.original_amount || sale.value || 0,
        final_amount: sale.final_amount || sale.value || 0,
        sale_type: 'unica',
        is_subscription: false
      };
    });

    console.log('[salesService] ✅ Vendas únicas encontradas:', formattedUniqueSales.length);

    // 5. FORMATAR MENSALIDADES
    const unifiedSubscriptions = (subscriptionsData || []).map(sub => ({
      ...sub,
      client_name: sub.leads?.name || 'Cliente desconhecido',
      client_email: sub.leads?.email || '',
      stage_name: sub.product_sales_stages?.name || sub.products?.name || 'Mensalidade',
      stage_value: sub.product_sales_stages?.value || sub.monthly_value,
      value: sub.monthly_value,
      original_amount: sub.monthly_value,
      final_amount: sub.monthly_value,
      status: sub.status === 'active' || sub.status === 'ativa' ? 'ativa' : 'cancelada',
      sale_type: 'mensalidade',
      is_subscription: true,
    }));

    console.log('[salesService] ✅ Mensalidades encontradas:', unifiedSubscriptions.length);

    // 6. COMBINAR E ORDENAR
    const allSales = [...formattedUniqueSales, ...unifiedSubscriptions];
    allSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('[salesService] ✅ Total unificado:', allSales.length);
    return allSales;

  } catch (error) {
    console.error('[salesService] ❌ ERRO ao carregar vendas:', error);
    throw error;
  }
};


