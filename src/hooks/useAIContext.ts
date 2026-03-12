import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface AIContextData {
  ai_context: string;
  ai_services: {
    services?: string[];
    excluded_services?: string[];
    custom_instructions?: string;
  };
  ai_target_audience: string;
  ai_business_model: string;
}

const EMPTY_CONTEXT: AIContextData = {
  ai_context: '',
  ai_services: { services: [], excluded_services: [], custom_instructions: '' },
  ai_target_audience: '',
  ai_business_model: '',
};

export function useAIContext() {
  const { organizationId } = useOrganization();
  const [data, setData] = useState<AIContextData>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organizationId) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      try {
        console.log('[useAIContext] Carregando contexto para org:', organizationId);
        const { data: org, error } = await supabase
          .from('organizations')
          .select('ai_context, ai_services, ai_target_audience, ai_business_model')
          .eq('id', organizationId)
          .maybeSingle();

        if (error) { console.error('[useAIContext] Erro:', error); return; }

        if (org) {
          setData({
            ai_context: (org as any).ai_context || '',
            ai_services: (org as any).ai_services || { services: [], excluded_services: [], custom_instructions: '' },
            ai_target_audience: (org as any).ai_target_audience || '',
            ai_business_model: (org as any).ai_business_model || '',
          });
          console.log('[useAIContext] ✅ Contexto carregado');
        }
      } catch (err) {
        console.error('[useAIContext] Erro:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organizationId]);

  const save = useCallback(async (updated: AIContextData) => {
    if (!organizationId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ai_context: updated.ai_context,
          ai_services: updated.ai_services,
          ai_target_audience: updated.ai_target_audience,
          ai_business_model: updated.ai_business_model,
        } as any)
        .eq('id', organizationId);

      if (error) throw error;
      setData(updated);
      toast.success('Contexto da IA salvo com sucesso!');
      console.log('[useAIContext] ✅ Salvo');
    } catch (err: any) {
      console.error('[useAIContext] Erro ao salvar:', err);
      toast.error('Erro ao salvar contexto da IA');
    } finally {
      setSaving(false);
    }
  }, [organizationId]);

  const getFormattedContext = useCallback((): string => {
    if (!data.ai_context && !data.ai_target_audience) return '';

    const services = data.ai_services?.services?.join(', ') || 'Não definido';
    const excluded = data.ai_services?.excluded_services?.join(', ') || 'Nenhum';
    const custom = data.ai_services?.custom_instructions || '';

    return `
CONTEXTO DA ORGANIZAÇÃO:
Descrição: ${data.ai_context || 'Não definido'}
Serviços Oferecidos: ${services}
Serviços NÃO Oferecidos (evite sugerir): ${excluded}
Público-Alvo: ${data.ai_target_audience || 'Não definido'}
Modelo de Negócio: ${data.ai_business_model || 'Não definido'}
${custom ? `Instruções Customizadas: ${custom}` : ''}

USE ESSAS INFORMAÇÕES PARA GERAR SUGESTÕES RELEVANTES E EVITAR RECOMENDAÇÕES FORA DO CONTEXTO.
    `.trim();
  }, [data]);

  return { data, loading, saving, save, getFormattedContext };
}
