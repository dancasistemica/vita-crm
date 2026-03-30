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
    const table = saleType === 'unica' ? 'sales' : 'subscriptions';
    
    // Mapear campos se necessário para a tabela 'sales'
    const updateData = { ...data, updated_at: new Date().toISOString() };
    
    if (saleType === 'unica') {
      if (data.payment_method_id !== undefined) {
        updateData.payment_method = data.payment_method_id;
        delete updateData.payment_method_id;
      }
    }

    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', saleId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[SaleService] ❌ Erro ao atualizar venda:', error);
    throw error;
  }
};
