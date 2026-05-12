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
  let query = supabase
    .from('financial_transactions')
    .select(`
      *,
      category:financial_categories(name),
      subcategory:financial_subcategories(name),
      payment_method:payment_methods(name)
    `)
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: false });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.startDate) {
    query = query.gte('due_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('due_date', filters.endDate);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as FinancialTransactionWithJoins[];
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
