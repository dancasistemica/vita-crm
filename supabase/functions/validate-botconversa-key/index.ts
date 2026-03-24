import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    const { configId, organizationId } = await req.json();

    if (!configId || !organizationId) {
      return new Response(
        JSON.stringify({ valid: false, error: 'configId e organizationId são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: config, error: queryError } = await supabase
      .from('botconversa_config')
      .select('api_key')
      .eq('id', configId)
      .eq('organization_id', organizationId)
      .single();

    if (queryError || !config) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Configuração não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.botconversa.com.br/v1/account/info', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: data?.error?.message || 'Chave API inválida ou expirada',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Chave API validada com sucesso',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
