import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const whatsappApiToken = Deno.env.get('WHATSAPP_API_TOKEN')!;
const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const normalizePhone = (value: string) => value.replace(/\D/g, '');

serve(async (req) => {
  try {
    // VERIFICAÇÃO DE AUTENTICAÇÃO: Token secreto da organização
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[SendScheduledMessages] Erro: Header Authorization ausente ou inválido');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const providedToken = authHeader.substring(7); // Remove "Bearer "

    // Buscar organização pelo token secreto
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('cron_secret_token', providedToken)
      .single();

    if (orgError || !org) {
      console.error('[SendScheduledMessages] Erro: Token inválido ou organização não encontrada');
      return new Response(
        JSON.stringify({ error: 'Invalid token or organization not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SendScheduledMessages] Autenticação OK para organização: ${org.id}`);

    const now = new Date().toISOString();
    
    // Buscar mensagens pendentes APENAS desta organização
    const { data: messages, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (error) throw error;

    console.log(`[SendScheduledMessages] Encontradas ${messages?.length || 0} mensagens para enviar`);

    const results = await Promise.allSettled(
      (messages || []).map(async (msg) => {
        try {
          const response = await fetch(
            `https://graph.instagram.com/v18.0/${whatsappPhoneId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${whatsappApiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: normalizePhone(msg.phone_number),
                type: 'text',
                text: { body: msg.message_text },
              }),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result?.error?.message || 'Erro ao enviar mensagem');
          }

          await supabase
            .from('scheduled_messages')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', msg.id);

          console.log(`[SendScheduledMessages] Mensagem enviada: ${msg.id}`);
          return { success: true, messageId: msg.id };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await supabase
            .from('scheduled_messages')
            .update({
              status: 'failed',
              error_message: message,
            })
            .eq('id', msg.id);

          console.error(`[SendScheduledMessages] Erro ao enviar ${msg.id}:`, message);
          return { success: false, messageId: msg.id, error: message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    return new Response(
      JSON.stringify({
        message: 'Processamento concluído',
        organization_id: org.id,
        total: messages?.length || 0,
        successful,
        failed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SendScheduledMessages] Erro geral:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
