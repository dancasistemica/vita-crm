export interface Venda {
  id: string;
  organization_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  product_id: string;
  product_name: string;
  amount: number;
  
  // Campos de desconto
  discount_type?: 'none' | 'fixed' | 'percentage';
  discount_value?: number;
  discount_description?: string;
  original_amount?: number;
  final_amount?: number;
  discount_granted_by?: string; // UUID do usuário
  discount_granted_by_name?: string; // Nome do usuário
  discount_granted_at?: string; // ISO timestamp
  
  status: 'pending' | 'completed' | 'cancelled';
  payment_status?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscountCalculation {
  original_amount: number;
  discount_type: 'none' | 'fixed' | 'percentage';
  discount_value: number;
  discount_amount: number;
  final_amount: number;
}
