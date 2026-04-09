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

    if (saleData.initial_payment !== undefined) {
      if (!Number.isFinite(saleData.initial_payment) || saleData.initial_payment < 0) {
        console.error('[SalesService] ❌ Entrada inválida:', saleData.initial_payment);
        throw new Error('Entrada inválida');
      }

      if (saleData.initial_payment >= saleData.value) {
        console.error('[SalesService] ❌ Entrada maior/igual ao valor total:', saleData.initial_payment);
        throw new Error('Entrada inválida');
      }
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
        lead_id: saleData.client_id,
        value: saleData.value,
        status: saleData.status || 'pendente',
        notes: saleData.notes,
        payment_method: saleData.payment_method_id || '',
        product_id: saleData.sales_stage_id || null,
      })
      .select()
      .single();

    if (saleError) {
      console.error('[SalesService] ❌ Erro ao criar venda:', saleError);
      throw saleError;
    }

    console.log('[SalesService] ✅ Venda criada:', sale.id);

    // PASSO 2: Calcular e criar parcelas
    console.log('[SalesService] Calculando parcelas...');
    const installmentRecords: Array<{
      sale_id: string;
      organization_id: string;
      installment_number: number;
      due_date: string;
      amount: number;
      status: string;
      auto_payment_enabled: boolean;
    }> = [];
    const valueToInstall = saleData.value - (saleData.initial_payment || 0);
    const [year, month, day] = saleData.first_payment_date.split('-').map(Number);
    const dayOfMonth = day;
    const installmentAmount = valueToInstall / saleData.installments;

    for (let i = 1; i <= saleData.installments; i += 1) {
      // Cria a data para o mês correspondente
      const dueDate = new Date(year, month - 1 + (i - 1), dayOfMonth);
      
      // Se o dia do mês mudou (ex: Jan 31 -> Mar 2), ajustamos para o último dia do mês correto
      if (dueDate.getDate() !== dayOfMonth) {
        dueDate.setDate(0);
      }

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

    // ✨ NOVO: Converter lead em cliente
    console.log('[SalesService] Convertendo lead em cliente...');
    await convertLeadToClient(saleData.client_id, organizationId);

    return { sale, installments: installmentRecords };
  } catch (error) {
    console.error('[SalesService] ❌ Erro crítico ao criar venda com parcelamento:', error);
    throw error;
  }
};

export const createUniqueSale = createSaleWithInstallments;

export const deleteSale = async (saleId: string) => {
  try {
    console.log('[SalesService] Excluindo venda e parcelas:', saleId);
    
    // Primeiro excluímos as parcelas devido à constraint de FK
    const { error: installmentsError } = await supabase
      .from('sale_installments')
      .delete()
      .eq('sale_id', saleId);

    if (installmentsError) {
      console.error('[SalesService] ❌ Erro ao excluir parcelas:', installmentsError);
      throw installmentsError;
    }

    // Depois a venda principal
    const { error: saleError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (saleError) {
      console.error('[SalesService] ❌ Erro ao excluir venda:', saleError);
      throw saleError;
    }

    console.log('[SalesService] ✅ Venda excluída com sucesso');
    return true;
  } catch (error) {
    console.error('[SalesService] ❌ Erro crítico ao excluir venda:', error);
    throw error;
  }
};
