import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type, aiContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      suggest_response: `Você é uma assistente de vendas empática e acolhedora, especializada em dança terapêutica e desenvolvimento pessoal feminino. 
Gere sugestões de mensagens para leads com tom acolhedor, feminino, voltado para cura e transformação pessoal.
Sempre considere o contexto emocional da lead e sua jornada. Responda em português brasileiro.
Mantenha as mensagens curtas (máx 3 parágrafos), naturais e personalizadas.`,

      lead_insight: `Você é uma analista de perfis de leads especializada em dança terapêutica e bem-estar feminino.
Analise o perfil da lead e forneça:
1. Resumo do perfil emocional (2-3 frases)
2. Sugestão de abordagem de vendas (2-3 frases) 
3. Produto mais indicado para o perfil
4. Nível de urgência sugerido (baixo/médio/alto)
Responda em português brasileiro, de forma objetiva e empática.`,

      pipeline_tip: `Você é uma consultora de vendas especializada em dança terapêutica.
Com base na etapa do funil e dados da lead, sugira UMA ação específica e prática.
Seja direta, em 2-3 frases. Inclua uma sugestão de tarefa concreta.
Responda em português brasileiro.`,

      followup_message: `Você é uma redatora especializada em comunicação empática para negócios de dança terapêutica e bem-estar feminino.
Gere uma mensagem de follow-up personalizada considerando o canal (WhatsApp, email ou Instagram DM).
Tom: acolhedor, feminino, focado em transformação e cura pelo corpo.
Mantenha a mensagem natural e não muito longa. Responda em português brasileiro.`,

      weekly_summary: `Você é uma assistente de gestão de CRM para um negócio de dança terapêutica.
Analise os dados fornecidos e gere um resumo semanal contendo:
1. 🔴 Leads que precisam de atenção urgente
2. 🔥 Oportunidades quentes identificadas  
3. ⏰ Tarefas atrasadas com sugestão de ação
4. 💫 Frase motivacional personalizada para a vendedora
Responda em português brasileiro, de forma objetiva e encorajadora.`,
    };

    let systemPrompt = systemPrompts[type] || systemPrompts.suggest_response;

    // Append organization AI context if provided
    if (aiContext && typeof aiContext === 'string' && aiContext.trim()) {
      systemPrompt += `\n\n${aiContext}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crm-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
