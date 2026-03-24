import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    const now = new Date().toISOString()
    
    console.log('[ProcessScheduledMessages] Iniciando processamento em:', now)

    // Buscar mensagens pendentes que já passaram do horário agendado
    const { data: messages, error: queryError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)

    if (queryError) {
      console.error('[ProcessScheduledMessages] Erro na query:', queryError)
      throw queryError
    }

    console.log(`[ProcessScheduledMessages] Encontradas ${messages?.length || 0} mensagens para enviar`)

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma mensagem para processar', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let successful = 0
    let failed = 0

    // Processar cada mensagem
    for (const msg of messages) {
      try {
        console.log(`[ProcessScheduledMessages] Processando mensagem: ${msg.id}`)

        // Buscar chave API da organização
        const { data: config, error: configError } = await supabase
          .from('botconversa_config')
          .select('api_key')
          .eq('organization_id', msg.organization_id)
          .single()

        if (configError || !config?.api_key) {
          throw new Error('Chave API não configurada para esta organização')
        }

        console.log(`[ProcessScheduledMessages] Enviando para: ${msg.phone_number}`)

        // Fazer requisição para Botconversa
        const response = await fetch('https://api.botconversa.com.br/v1/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: msg.phone_number,
            message: msg.message_text,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || `Erro HTTP ${response.status}`)
        }

        // Atualizar status para enviado
        const { error: updateError } = await supabase
          .from('scheduled_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            botconversa_message_id: result.message_id || result.id,
          })
          .eq('id', msg.id)

        if (updateError) throw updateError

        console.log(`[ProcessScheduledMessages] ✓ Enviado: ${msg.id}`)
        successful++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`[ProcessScheduledMessages] ✗ Erro em ${msg.id}: ${errorMsg}`)

        // Atualizar status para falha
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', msg.id)

        failed++
      }
    }

    console.log(`[ProcessScheduledMessages] Processamento concluído: ${successful} enviadas, ${failed} falhadas`)

    return new Response(
      JSON.stringify({
        message: 'Processamento concluído',
        total: messages.length,
        successful,
        failed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[ProcessScheduledMessages] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
