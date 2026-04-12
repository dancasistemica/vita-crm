import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type ClientProduct = Database['public']['Tables']['client_products']['Row'];
export type ClassAttendance = Database['public']['Tables']['class_attendance']['Row'];

export interface ClientWithProduct {
  id: string;
  name: string;
  email: string;
  phone: string;
  product_id: string;
  product_name: string;
  payment_status: string;
  payment_method: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  last_attendance_date: string | null;
  attendance_count: number;
  engagement_level: string;
  risk_of_churn: boolean;
}

export async function fetchClientsByProduct(
  organizationId: string,
  productId?: string,
  filters?: {
    paymentStatus?: string;
    engagementLevel?: string;
    riskOfChurn?: boolean;
    searchTerm?: string;
  }
) {
  console.log('[clientProductService] Buscando clientes por produto:', {
    organizationId,
    productId,
    filters,
  });

  let query = supabase
    .from('client_products')
    .select(
      `
      id,
      client_id,
      product_id,
      payment_status,
      payment_method,
      plan_type,
      start_date,
      end_date,
      created_at,
      clientes:client_id (
        id,
        name,
        email,
        phone,
        engagement_level,
        last_attendance_date
      ),
      products:product_id (
        id,
        name
      )
    `
    )
    .eq('organization_id', organizationId);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (filters?.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  // Note: Filtering on joined tables in Supabase works by checking if any record exists.
  // We use .not('clientes', 'is', null) or similar if needed, but eq('clientes.field') 
  // actually performs an inner join filter in newer postgrest versions if specified.
  if (filters?.engagementLevel) {
    query = query.eq('clientes.engagement_level', filters.engagementLevel);
  }

  if (filters?.riskOfChurn) {
    query = query.eq('risk_of_churn', true);
  }

  if (filters?.searchTerm) {
    // Se houver termo de busca, tentamos filtrar pelo nome ou email do cliente
    // Como o filtro é em tabela relacionada, o ideal seria usar !inner se quisermos 
    // que o banco filtre. Para simplificar e manter compatibilidade:
    query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`, { foreignTable: 'clientes' });
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[clientProductService] Erro ao buscar clientes:', error);
    throw error;
  }

  // Frontend filtering for search term if provided
  let results = data || [];
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    results = results.filter(item => {
      const client = item.clientes as any;
      return (
        client?.name?.toLowerCase().includes(term) ||
        client?.email?.toLowerCase().includes(term)
      );
    });
  }

  console.log('[clientProductService] Clientes encontrados:', results.length);
  return results;
}

export async function fetchProductsForOrganization(organizationId: string) {
  console.log('[clientProductService] Buscando produtos da organização:', organizationId);

  const { data, error } = await supabase
    .from('products')
    .select('id, name, type, description')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (error) {
    console.error('[clientProductService] Erro ao buscar produtos:', error);
    throw error;
  }

  console.log('[clientProductService] Produtos encontrados:', data?.length);
  return data || [];
}

export async function getProductMetrics(
  organizationId: string,
  productId: string
) {
  console.log('[clientProductService] Calculando métricas do produto:', productId);

  const { data, error } = await supabase
    .from('client_products')
    .select('payment_status, clientes:client_id (engagement_level)')
    .eq('organization_id', organizationId)
    .eq('product_id', productId);

  if (error) {
    console.error('[clientProductService] Erro ao calcular métricas:', error);
    throw error;
  }

  const total = data?.length || 0;
  const active = data?.filter((cp) => cp.payment_status === 'ATIVO').length || 0;
  const inactive = total - active;

  return {
    total,
    active,
    inactive,
    activePercentage: total > 0 ? ((active / total) * 100).toFixed(1) : 0,
  };
}

export async function updateClientProductBatch(
  clientProductIds: string[],
  updates: {
    payment_status?: string;
    plan_type?: string;
  }
) {
  console.log('[clientProductService] Atualizando em massa:', {
    count: clientProductIds.length,
    updates,
  });

  const { error } = await supabase
    .from('client_products')
    .update(updates)
    .in('id', clientProductIds);

  if (error) {
    console.error('[clientProductService] Erro ao atualizar:', error);
    throw error;
  }

  console.log('[clientProductService] Atualização concluída com sucesso');
}

export async function getAttendanceHistory(
  clientId: string,
  productId: string
) {
  console.log('[clientProductService] Buscando histórico de presença:', {
    clientId,
    productId,
  });

  const { data, error } = await supabase
    .from('class_attendance')
    .select('class_date, attendance_type')
    .eq('client_id', clientId)
    .eq('product_id', productId)
    .order('class_date', { ascending: false });

  if (error) {
    console.error('[clientProductService] Erro ao buscar histórico:', error);
    throw error;
  }

  return data || [];
}
