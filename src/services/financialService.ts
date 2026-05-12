import { supabase } from "@/lib/supabase";

export interface FinancialCategory {
  id: string;
  organization_id: string;
  name: string;
  type: 'receita' | 'despesa';
  description?: string;
  created_at: string;
}

export interface FinancialSubcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category_id?: string;
  subcategory_id?: string;
  due_date: string;
  payment_date?: string | null;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  payment_method_id?: string;
  supplier_client_name?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface FinancialTransactionWithJoins extends FinancialTransaction {
  category?: { name: string } | null;
  subcategory?: { name: string } | null;
  payment_method?: { name: string } | null;
  origin?: 'manual' | 'venda' | 'assinatura';
  client_id?: string;
  sale_id?: string;
  subscription_id?: string;
}

export const getFinancialCategories = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('financial_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');
  
  if (error) throw error;
  return data as FinancialCategory[];
};

export const getFinancialSubcategories = async (categoryId: string) => {
  const { data, error } = await supabase
    .from('financial_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('name');
  
  if (error) throw error;
  return data as FinancialSubcategory[];
};

export const getFinancialTransactions = async (organizationId: string, filters?: {
  type?: 'receita' | 'despesa';
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const allTransactions: FinancialTransactionWithJoins[] = [];

    // 1. Manual Transactions
    let manualQuery = supabase
      .from('financial_transactions')
      .select(`
        *,
        category:financial_categories(name),
        subcategory:financial_subcategories(name),
        payment_method:payment_methods(name)
      `)
      .eq('organization_id', organizationId);

    if (filters?.type) manualQuery = manualQuery.eq('type', filters.type);
    if (filters?.status) manualQuery = manualQuery.eq('status', filters.status);
    if (filters?.startDate) manualQuery = manualQuery.gte('due_date', filters.startDate);
    if (filters?.endDate) manualQuery = manualQuery.lte('due_date', filters.endDate);

    const { data: manualData, error: manualError } = await manualQuery;
    if (manualError) throw manualError;

    if (manualData) {
      allTransactions.push(...manualData.map(tx => ({ ...tx, origin: 'manual' as const })));
    }

    // 2. Sales Installments (as Revenue)
    if (!filters?.type || filters.type === 'receita') {
      let salesQuery = supabase
        .from('sale_installments')
        .select(`
          id,
          organization_id,
          due_date,
          paid_date,
          amount,
          status,
          notes,
          sales:sale_id(
            id,
            description,
            leads:lead_id(name)
          )
        `)
        .eq('organization_id', organizationId);

      if (filters?.status) salesQuery = salesQuery.eq('status', filters.status);
      if (filters?.startDate) salesQuery = salesQuery.gte('due_date', filters.startDate);
      if (filters?.endDate) salesQuery = salesQuery.lte('due_date', filters.endDate);

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) {
        console.error('Error fetching sales installments:', salesError);
      } else if (salesData) {
        allTransactions.push(...salesData.map(inst => {
          const sale = inst.sales as any;
          return {
            id: inst.id,
            organization_id: inst.organization_id,
            description: `Parcela Venda: ${sale?.description || ''}`,
            amount: Number(inst.amount),
            type: 'receita' as const,
            due_date: inst.due_date,
            payment_date: inst.paid_date,
            status: inst.status as any,
            supplier_client_name: sale?.leads?.name,
            notes: inst.notes,
            origin: 'venda' as const,
            sale_id: inst.sale_id,
            created_at: new Date().toISOString(), // Mocked as we don't need it for listing
            category: { name: 'Vendas' }
          };
        }));
      }

      // 3. Subscription Payments (as Revenue)
      let subsQuery = supabase
        .from('subscription_payments')
        .select(`
          id,
          organization_id,
          due_date,
          paid_date,
          amount,
          status,
          notes,
          subscriptions:subscription_id(
            id,
            leads:client_id(name),
            products:product_id(name)
          )
        `)
        .eq('organization_id', organizationId);

      if (filters?.status) subsQuery = subsQuery.eq('status', filters.status);
      if (filters?.startDate) subsQuery = subsQuery.gte('due_date', filters.startDate);
      if (filters?.endDate) subsQuery = subsQuery.lte('due_date', filters.endDate);

      const { data: subsData, error: subsError } = await subsQuery;
      if (subsError) {
        console.error('Error fetching subscription payments:', subsError);
      } else if (subsData) {
        allTransactions.push(...subsData.map(pay => {
          const sub = pay.subscriptions as any;
          return {
            id: pay.id,
            organization_id: pay.organization_id,
            description: `Mensalidade: ${sub?.products?.name || ''}`,
            amount: Number(pay.amount),
            type: 'receita' as const,
            due_date: pay.due_date,
            payment_date: pay.paid_date,
            status: pay.status as any,
            supplier_client_name: sub?.leads?.name,
            notes: pay.notes,
            origin: 'assinatura' as const,
            subscription_id: pay.subscription_id,
            created_at: new Date().toISOString(),
            category: { name: 'Assinaturas' }
          };
        }));
      }
    }

    // Sort all by due_date descending
    allTransactions.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

    return allTransactions;
  } catch (error) {
    console.error('Error in getFinancialTransactions:', error);
    throw error;
  }
};

export const createFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert([transaction])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateFinancialTransaction = async (id: string, updates: Partial<Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteFinancialTransaction = async (id: string) => {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const createFinancialCategory = async (category: Omit<FinancialCategory, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('financial_categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createFinancialSubcategory = async (subcategory: Omit<FinancialSubcategory, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('financial_subcategories')
    .insert([subcategory])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
