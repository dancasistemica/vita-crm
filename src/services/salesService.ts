import { supabase } from '@/integrations/supabase/client';

interface CreateSaleInput {
  client_id: string;
  value: number;
  status: string;
  installments: number;
  first_payment_date: string;
  auto_payment_enabled: boolean;
  notes?: string;
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
      items: saleData.items?.length || 0,
      auto_payment: saleData.auto_payment_enabled,
      first_payment_date: saleData.first_payment_date,
    });

    if (!organizationId) {
      console.error('[SalesService] ❌ organizationId ausente');
      throw new Error('organizationId ausente');
    }

    if (!saleData.client_id) {
      console.error('[SalesService] ❌ client_id ausente');
      throw new Error('client_id ausente');
    }

    if (!saleData.first_payment_date) {
      console.error('[SalesService] ❌ first_payment_date ausente');
      throw new Error('first_payment_date ausente');
    }

    if (!Number.isFinite(saleData.value) || saleData.value <= 0) {
      console.error('[SalesService] ❌ Valor inválido:', saleData.value);
      throw new Error('Valor inválido');
    }

    if (!Number.isFinite(saleData.installments) || saleData.installments < 1) {
      console.error('[SalesService] ❌ Parcelas inválidas:', saleData.installments);
      throw new Error('Parcelas inválidas');
    }

    if (!saleData.items || saleData.items.length === 0) {
      console.error('[SalesService] ❌ Nenhum item informado');
      throw new Error('Nenhum item informado');
    }

    console.log('[SalesService] Validando cliente no banco...');
    const { data: client, error: clientError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', saleData.client_id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (clientError) {
      console.error('[SalesService] ❌ Erro ao validar cliente:', clientError);
      throw clientError;
    }

    if (!client?.id) {
      console.error('[SalesService] ❌ Cliente não encontrado:', saleData.client_id);
      throw new Error('Cliente não encontrado');
    }

    console.log('[SalesService] ✅ Cliente validado:', client.id);

    // PASSO 1: Criar venda em sales
    console.log('[SalesService] Criando venda em sales...');
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        organization_id: organizationId,
        client_id: saleData.client_id,
        value: saleData.value,
        status: saleData.status || 'pendente',
        notes: saleData.notes,
      })
      .select()
      .single();

    if (saleError) {
      console.error('[SalesService] ❌ Erro ao criar venda:', saleError);
      throw saleError;
    }

    console.log('[SalesService] ✅ Venda criada:', sale.id);

    if (saleData.items && saleData.items.length > 0) {
      console.log('[SalesService] Criando itens da venda:', saleData.items.length);
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        organization_id: organizationId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('[SalesService] ❌ Erro ao criar itens:', itemsError);
        throw itemsError;
      }

      console.log('[SalesService] ✅ Itens criados');
    }

    // PASSO 2: Calcular e criar parcelas (mensal fixo de 30 dias)
    console.log('[SalesService] Calculando parcelas...');
    const installmentRecords = [] as Array<Record<string, unknown>>;
    const firstPaymentDate = new Date(saleData.first_payment_date);
    const installmentAmount = saleData.value / saleData.installments;

    for (let i = 1; i <= saleData.installments; i += 1) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setDate(dueDate.getDate() + 30 * (i - 1));

      installmentRecords.push({
        sale_id: sale.id,
        organization_id: organizationId,
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: parseFloat(installmentAmount.toFixed(2)),
        status: 'pendente',
        auto_payment_enabled: saleData.auto_payment_enabled,
      });

      console.log(
        `[SalesService] Parcela ${i}/${saleData.installments}: ${dueDate.toISOString().split('T')[0]} - R$ ${installmentAmount.toFixed(2)}`
      );
    }

    // PASSO 3: Inserir parcelas em sale_installments
    console.log('[SalesService] Inserindo parcelas em sale_installments...');
    const { error: installmentsError } = await supabase
      .from('sale_installments')
      .insert(installmentRecords);

    if (installmentsError) {
      console.error('[SalesService] ❌ Erro ao criar parcelas:', installmentsError);
      throw installmentsError;
    }

    console.log('[SalesService] ✅ Venda com parcelamento criada com sucesso');
    return { sale, installments: installmentRecords };
  } catch (error) {
    console.error('[SalesService] ❌ Erro crítico ao criar venda com parcelamento:', error);
    throw error;
  }
};
