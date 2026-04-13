import { supabase } from "@/integrations/supabase/client";

export interface AsaasPayment {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'RECEIVED' | 'CANCELLED';
  due_date: string;
  payment_date?: string;
  description: string;
  invoice_url?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
}

export const testAsaasConnection = async (apiKey: string): Promise<boolean> => {
  try {
    console.log('[asaasService] Testando conexão com Asaas');

    // Nota: Em browsers modernos, chamadas diretas para a API do Asaas podem ser bloqueadas por CORS.
    // O ideal seria processar isso via Edge Functions no Supabase.
    const response = await fetch('https://api.asaas.com/v3/accounts', {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
    });

    if (!response.ok) {
      console.error('[asaasService] ❌ Erro na conexão:', response.statusText);
      return false;
    }

    console.log('[asaasService] ✅ Conexão bem-sucedida');
    return true;
  } catch (error) {
    console.error('[asaasService] ❌ Erro ao testar conexão:', error);
    return false;
  }
};

export const fetchAsaasPayments = async (
  apiKey: string,
  customerId?: string
): Promise<AsaasPayment[]> => {
  try {
    console.log('[asaasService] Buscando pagamentos do Asaas');

    let url = 'https://api.asaas.com/v3/payments?limit=100';
    if (customerId) {
      url += `&customer=${customerId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar pagamentos: ${response.statusText}`);
    }

    const data = await response.json();

    const payments: AsaasPayment[] = (data.data || []).map((payment: any) => ({
      id: payment.id,
      customer_id: payment.customer,
      customer_name: payment.customerName,
      customer_email: payment.customerEmail,
      amount: payment.value,
      status: payment.status,
      due_date: payment.dueDate,
      payment_date: payment.paymentDate,
      description: payment.description,
      invoice_url: payment.invoiceUrl,
    }));

    console.log('[asaasService] ✅ Pagamentos encontrados:', payments.length);
    return payments;
  } catch (error) {
    console.error('[asaasService] ❌ Erro ao buscar pagamentos:', error);
    throw error;
  }
};

export const fetchAsaasCustomers = async (apiKey: string): Promise<AsaasCustomer[]> => {
  try {
    console.log('[asaasService] Buscando clientes do Asaas');

    const response = await fetch('https://api.asaas.com/v3/customers?limit=100', {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar clientes: ${response.statusText}`);
    }

    const data = await response.json();

    const customers: AsaasCustomer[] = (data.data || []).map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf_cnpj: customer.cpfCnpj,
      address: customer.address,
      city: customer.city,
      state: customer.state,
    }));

    console.log('[asaasService] ✅ Clientes encontrados:', customers.length);
    return customers;
  } catch (error) {
    console.error('[asaasService] ❌ Erro ao buscar clientes:', error);
    throw error;
  }
};

export const syncPaymentsWithSales = async (
  organizationId: string,
  payments: AsaasPayment[]
): Promise<{ synced: number; failed: number }> => {
  try {
    console.log('[asaasService] Sincronizando pagamentos com vendas');

    let synced = 0;
    let failed = 0;

    for (const payment of payments) {
      try {
        // Buscar venda correspondente (usando o e-mail do cliente)
        const { data: sale } = await supabase
          .from('sales')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('client_email', payment.customer_email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sale) {
          // Mapear status Asaas para status de venda
          let saleStatus = 'pending';
          if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
            saleStatus = 'completed';
          } else if (payment.status === 'CANCELLED') {
            saleStatus = 'cancelled';
          } else if (payment.status === 'OVERDUE') {
            saleStatus = 'overdue';
          }

          // Atualizar venda
          await supabase
            .from('sales')
            .update({
              status: saleStatus,
              payment_status: payment.status,
              payment_date: payment.payment_date || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sale.id);

          synced++;
          console.log(`[asaasService] ✅ Venda sincronizada: ${payment.customer_email}`);
        } else {
          failed++;
          console.warn(`[asaasService] ⚠️ Venda não encontrada para: ${payment.customer_email}`);
        }
      } catch (err) {
        failed++;
        console.error(`[asaasService] ❌ Erro ao sincronizar pagamento para ${payment.customer_email}:`, err);
      }
    }

    return { synced, failed };
  } catch (error) {
    console.error('[asaasService] ❌ Erro geral na sincronização:', error);
    throw error;
  }
};
