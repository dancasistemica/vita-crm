import { supabase } from '@/integrations/supabase/client';
import { convertLeadToClient } from './saleService';

interface CreateSaleInput {
  client_id: string;
  value: number;
  status: string;
  installments: number;
  first_payment_date: string;
  auto_payment_enabled: boolean;
  notes?: string;
  payment_method_id?: string;
  initial_payment?: number;
  sales_stage_id?: string;
  discount_type?: string;
  discount_value?: number;
  discount_description?: string;
  original_amount?: number;
  final_amount?: number;
  discount_granted_by?: string;
  discount_granted_at?: string;
  items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const createSaleWithInstallments = async (organizationId: string, saleData: CreateSaleInput) => {
  try {
    console.log('[SalesService] Criando venda com parcelamento:', {
      organizationId,
      client_id: saleData.client_id,
      value: saleData.value,
      installments: saleData.installments,
      auto_payment: saleData.auto_payment_enabled,
      first_payment_date: saleData.first_payment_date,
    });

    if (!organizationId) throw new Error('organizationId ausente');
    if (!saleData.client_id) throw new Error('client_id ausente');
    if (!saleData.first_payment_date) throw new Error('first_payment_date ausente');
    if (!Number.isFinite(saleData.value) || saleData.value <= 0) throw new Error('Valor inválido');
    if (!Number.isFinite(saleData.installments) || saleData.installments < 1) throw new Error('Parcelas inválidas');

    // Resolver nome do método de pagamento se um ID foi fornecido
    let paymentMethodName = '';
    if (saleData.payment_method_id) {
      const { data: pm } = await supabase
        .from('payment_methods')
        .select('name')
        .eq('id', saleData.payment_method_id)
        .maybeSingle();
      if (pm) paymentMethodName = pm.name;
    }

    // PASSO 1: Criar venda em sales
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        organization_id: organizationId,
        lead_id: saleData.client_id,
        value: saleData.final_amount || saleData.value, // Usa final_amount se disponível
        status: saleData.status || 'pendente',
        notes: saleData.notes,
        payment_method: paymentMethodName || saleData.payment_method_id || '',
        product_id: saleData.sales_stage_id || null,
        discount_type: saleData.discount_type,
        discount_value: saleData.discount_value,
        discount_description: saleData.discount_description,
        original_amount: saleData.original_amount || saleData.value,
        final_amount: saleData.final_amount || saleData.value,
        discount_granted_by: saleData.discount_granted_by,
        discount_granted_at: saleData.discount_granted_at,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // PASSO 2: Calcular e criar parcelas
    const installmentRecords = [];
    const valueToInstall = saleData.value - (saleData.initial_payment || 0);
    const [year, month, day] = saleData.first_payment_date.split('-').map(Number);
    const installmentAmount = valueToInstall / saleData.installments;

    for (let i = 1; i <= saleData.installments; i += 1) {
      const dueDate = new Date(year, month - 1 + (i - 1), day);
      if (dueDate.getDate() !== day) dueDate.setDate(0);

      installmentRecords.push({
        sale_id: sale.id,
        organization_id: organizationId,
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: parseFloat(installmentAmount.toFixed(2)),
        status: 'pendente',
        auto_payment_enabled: saleData.auto_payment_enabled,
      });
    }

    // PASSO 3: Inserir parcelas
    const { error: installmentsError } = await supabase
      .from('sale_installments')
      .insert(installmentRecords);

    if (installmentsError) throw installmentsError;

    // Converter lead em cliente
    await convertLeadToClient(saleData.client_id, organizationId);

    // ✨ NOVO: Registrar relacionamento com produto se houver
    if (saleData.sales_stage_id) {
      try {
        // Obter o product_id real da etapa de venda
        const { data: stage } = await supabase
          .from('product_sales_stages')
          .select('product_id')
          .eq('id', saleData.sales_stage_id)
          .single();

        if (stage?.product_id) {
          await supabase
            .from('client_products')
            .upsert({
              organization_id: organizationId,
              client_id: saleData.client_id,
              product_id: stage.product_id,
              payment_status: 'ATIVO', // Se criou venda com parcelas, assumimos que está ativo
              start_date: new Date().toISOString().split('T')[0],
              plan_type: 'AVULSO'
            }, { onConflict: 'client_id,product_id' });
        }
      } catch (cpErr) {
        console.warn('[SalesService] Erro ao registrar client_product:', cpErr);
      }
    }

    return { sale, installments: installmentRecords };
  } catch (error) {
    console.error('[SalesService] ❌ Erro ao criar venda:', error);
    throw error;
  }
};

export const createUniqueSale = createSaleWithInstallments;
export const createSale = createSaleWithInstallments;

export const deleteSale = async (saleId: string) => {
  try {
    // Primeiro excluímos as parcelas
    await supabase.from('sale_installments').delete().eq('sale_id', saleId);
    // Depois a venda
    await supabase.from('sales').delete().eq('id', saleId);
    return true;
  } catch (error) {
    console.error('[SalesService] ❌ Erro ao excluir venda:', error);
    throw error;
  }
};

export const fetchSales = async (
  organizationId: string
): Promise<any[]> => {
  try {
    console.log('[salesService] 📊 Buscando vendas');

    // Query simples sem JOINs problemáticos
    // Adicionamos leads(name, email) pois existe relação via foreign key
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        leads(name, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[salesService] ❌ Erro na query:', error);
      throw error;
    }

    // Buscar etapas de venda separadamente pois não há relação FK definida no banco
    const { data: stages } = await supabase
      .from('product_sales_stages')
      .select('id, name, value');

    const stagesMap = new Map((stages || []).map(s => [s.id, s]));

    // Mapear para o formato que a UI espera (client_name, stage_name, etc.)
    const formattedSales = sales?.map(sale => {
      const stage = stagesMap.get(sale.product_id);
      return {
        ...sale,
        client_name: sale.leads?.name || 'Cliente Desconhecido',
        client_email: sale.leads?.email || '',
        stage_name: stage?.name || 'Venda Direta',
        stage_value: sale.final_amount || stage?.value || 0,
        original_amount: sale.original_amount || stage?.value || 0,
        sale_type: 'unica',
      };
    }) || [];

    console.log('[salesService] ✅ Vendas carregadas:', formattedSales.length);
    return formattedSales;
  } catch (error) {
    console.error('[salesService] ❌ Erro ao buscar vendas:', error);
    throw error;
  }
};
