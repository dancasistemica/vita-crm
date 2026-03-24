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
    // STEP 1: Validar Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[SendScheduledMessages] 401: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const providedToken = authHeader.substring(7); // Remove "Bearer "

    // STEP 2: Buscar organização pelo token
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('cron_secret_token', providedToken)
      .single();

    if (orgError || !org) {
      console.error('[SendScheduledMessages] 401: Invalid token or organization not found');
      return new Response(
        JSON.stringify({ error: 'Invalid token or organization not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SendScheduledMessages] ✓ Authenticated for organization: ${org.id}`);

    // STEP 3: Buscar mensagens pendentes da organização
    const now = new Date().toISOString();
    const { data: messages, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (error) throw error;

    console.log(`[SendScheduledMessages] Found ${messages?.length || 0} messages to send for org ${org.id}`);

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No messages to process', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // STEP 4: Processar cada mensagem
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
            throw new Error(result?.error?.message || 'Error sending message');
          }

          await supabase
            .from('scheduled_messages')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', msg.id);

          console.log(`[SendScheduledMessages] ✓ Sent: ${msg.id}`);
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

          console.error(`[SendScheduledMessages] ✗ Error sending ${msg.id}: ${message}`);
          return { success: false, messageId: msg.id, error: message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`[SendScheduledMessages] ✓ Completed: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Processing completed',
        organization_id: org.id,
        total: messages.length,
        successful,
        failed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SendScheduledMessages] ✗ General error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
