export interface Venda {
  id: string;
  organization_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  product_id: string;
  product_name: string;
  amount: number;
  
  // NOVO: Campos de desconto
  discount_type?: 'fixed' | 'percentage'; // fixed = R$, percentage = %
  discount_value?: number; // Valor do desconto
  discount_description?: string; // Motivo/detalhes do desconto
  original_amount?: number; // Valor antes do desconto
  final_amount?: number; // Valor após desconto
  
  status: 'pending' | 'completed' | 'cancelled';
  payment_status?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}
