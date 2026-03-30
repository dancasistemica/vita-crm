import { supabase } from '@/integrations/supabase/client';

export const getSaleById = async (
  saleId: string,
  saleType: 'unica' | 'mensalidade'
) => {
  try {
    console.log('[SaleService] Buscando venda:', { saleId, saleType });

    if (saleType === 'unica') {
      // Buscar venda única
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          lead_id,
          leads(name),
          product_id,
          product_sales_stages(name, value),
          payment_method,
          status,
          notes,
          created_at,
          updated_at
        `)
        .eq('id', saleId)
        .single();

      if (error) {
        console.error('[SaleService] ❌ Erro ao buscar venda única:', error);
        throw error;
      }

      console.log('[SaleService] ✅ Venda única encontrada:', data);
      
      // Adaptar nomes de campos para consistência se necessário
      return {
        ...data,
        client_id: data.lead_id,
        sales_stage_id: data.product_id,
        payment_method_id: data.payment_method,
      };
    } else {
      // Buscar mensalidade
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          client_id,
          leads(name),
          sales_stage_id,
          product_sales_stages(name, value),
          monthly_value,
          payment_method_id,
          payment_methods(name),
          status,
          notes,
          start_date,
          end_date,
          created_at,
          updated_at
        `)
        .eq('id', saleId)
        .single();

      if (error) {
        console.error('[SaleService] ❌ Erro ao buscar mensalidade:', error);
        throw error;
      }

      console.log('[SaleService] ✅ Mensalidade encontrada:', data);
      return data;
    }
  } catch (error) {
    console.error('[SaleService] ❌ Erro crítico ao buscar venda:', error);
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
