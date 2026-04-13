import { supabase } from '@/integrations/supabase/client';
import { 
  fetchSales as fetchSalesFromPlural,
  createSaleWithInstallments,
  deleteSale as deleteSaleFromPlural,
  convertLeadToClient as convertLeadToClientFromPlural
} from './salesService';

// Re-exportar funções do salesService (plural) para manter compatibilidade
export const fetchSales = fetchSalesFromPlural;
export const createUniqueSale = createSaleWithInstallments;
export const convertLeadToClient = convertLeadToClientFromPlural;

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

// convertLeadToClient moved to salesService.ts to break circular dependency
