import { supabase } from '@/integrations/supabase/client';
import { 
  fetchSales as fetchSalesFromPlural,
  createSaleWithInstallments,
  deleteSale as deleteSaleFromPlural
} from './salesService';

// Re-exportar funções do salesService (plural) para manter compatibilidade
export const fetchSales = fetchSalesFromPlural;
export const createUniqueSale = createSaleWithInstallments;

export const getSaleById = async (
  saleId: string,
  saleType: 'unica' | 'mensalidade'
) => {
  try {
    const table = saleType === 'unica' ? 'sales' : 'subscriptions';
    const { data, error } = await supabase
      .from(table)
      .select(`
        *,
        leads(name, email)
      `)
      .eq('id', saleId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[SaleService] Erro ao buscar venda:', error);
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
    const { error } = await supabase
      .from(table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', saleId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[SaleService] Erro ao atualizar:', error);
    throw error;
  }
};

export const deleteSale = deleteSaleFromPlural;

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
