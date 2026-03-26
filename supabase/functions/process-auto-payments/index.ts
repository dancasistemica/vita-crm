import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

serve(async (req) => {
  try {
    console.log('[ProcessAutoPayments] Iniciando processamento de baixa automática')
    console.log('[ProcessAutoPayments] Timestamp:', new Date().toISOString())

    // PASSO 1: Buscar parcelas vencidas com auto_payment_enabled = true
    const today = new Date().toISOString().split('T')[0]
    
    console.log(`[ProcessAutoPayments] Buscando parcelas vencidas até ${today} com auto_payment_enabled = true`)

    const { data: pendingInstallments, error: fetchError } = await supabase
      .from('sale_installments')
      .select('id, sale_id, organization_id, installment_number, due_date, amount, status')
      .eq('auto_payment_enabled', true)
      .eq('status', 'pendente')
      .lte('due_date', today)
      .order('due_date', { ascending: true })

    if (fetchError) {
      console.error('[ProcessAutoPayments] ❌ Erro ao buscar parcelas:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: fetchError.message,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`[ProcessAutoPayments] Encontradas ${pendingInstallments?.length || 0} parcelas para processar`)

    if (!pendingInstallments || pendingInstallments.length === 0) {
      console.log('[ProcessAutoPayments] ✅ Nenhuma parcela para processar')
      return new Response(
        JSON.stringify({ 
          success: true, 
          processedCount: 0,
          message: 'Nenhuma parcela para processar',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // PASSO 2: Processar cada parcela
    let processedCount = 0
    let errorCount = 0
    const processedInstallments: any[] = []

    for (const installment of pendingInstallments) {
      try {
        console.log(`[ProcessAutoPayments] Processando parcela ${installment.installment_number} da venda ${installment.sale_id}`)

        // Marcar como pago
        const { error: updateError } = await supabase
          .from('sale_installments')
          .update({
            status: 'pago',
            paid_date: today,
            payment_method: 'automático',
            notes: `Pagamento automático no vencimento (${today})`
          })
          .eq('id', installment.id)

        if (updateError) {
          console.error(`[ProcessAutoPayments] ❌ Erro ao atualizar parcela ${installment.id}:`, updateError)
          errorCount++
          continue
        }

        console.log(`[ProcessAutoPayments] ✅ Parcela ${installment.installment_number} marcada como paga`)
        processedCount++
        processedInstallments.push({
          id: installment.id,
          sale_id: installment.sale_id,
          installment_number: installment.installment_number,
          amount: installment.amount,
          paid_date: today
        })

        // PASSO 3: Verificar se todas as parcelas da venda foram pagas
        const { data: allInstallments, error: checkError } = await supabase
          .from('sale_installments')
          .select('status')
          .eq('sale_id', installment.sale_id)

        if (!checkError && allInstallments) {
          const allPaid = allInstallments.every(inst => inst.status === 'pago')
          
          if (allPaid) {
            console.log(`[ProcessAutoPayments] Todas as parcelas da venda ${installment.sale_id} foram pagas. Atualizando status da venda...`)

            // Atualizar status da venda para 'completo'
            const { error: saleError } = await supabase
              .from('sales')
              .update({ status: 'completo' })
              .eq('id', installment.sale_id)

            if (saleError) {
              console.error(`[ProcessAutoPayments] ⚠️ Erro ao atualizar venda ${installment.sale_id}:`, saleError)
            } else {
              console.log(`[ProcessAutoPayments] ✅ Venda ${installment.sale_id} marcada como completa`)
            }
          }
        }
      } catch (error) {
        console.error(`[ProcessAutoPayments] ❌ Erro crítico ao processar parcela:`, error)
        errorCount++
      }
    }

    // PASSO 4: Log final
    console.log(`[ProcessAutoPayments] ✅ Processamento concluído`)
    console.log(`[ProcessAutoPayments] Parcelas processadas: ${processedCount}`)
    console.log(`[ProcessAutoPayments] Erros: ${errorCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        errorCount,
        processedInstallments,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('[ProcessAutoPayments] ❌ Erro crítico:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(error),
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
