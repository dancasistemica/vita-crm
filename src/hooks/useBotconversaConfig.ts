import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BotconversaConfig {
  id: string;
  organization_id: string;
  api_key: string;
  is_active: boolean;
}

export const useBotconversaConfig = (organizationId: string) => {
  const [config, setConfig] = useState<BotconversaConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    if (!organizationId) {
      console.log('[BotconversaConfig] organizationId não fornecido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[BotconversaConfig] Carregando config para org:', organizationId);

      const { data, error: queryError } = await supabase
        .from('botconversa_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      console.log('[BotconversaConfig] Resposta da query:', { data, error: queryError });

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          console.log('[BotconversaConfig] Nenhuma config encontrada (esperado)');
          setConfig(null);
          setLoading(false);
          return;
        }

        console.error(
          '[BotconversaConfig] Erro na query:',
          queryError.code,
          queryError.message,
        );
        throw queryError;
      }

      console.log('[BotconversaConfig] Config carregada:', data?.id);
      setConfig(data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[BotconversaConfig] Erro ao carregar:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (apiKey: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (!apiKey.trim()) {
        throw new Error('Chave API obrigatória');
      }

      console.log('[BotconversaConfig] Salvando chave para org:', organizationId);

      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      let result: BotconversaConfig | null = null;

      if (config?.id) {
        console.log('[BotconversaConfig] Atualizando config existente:', config.id);

        const { data, error: updateError } = await supabase
          .from('botconversa_config')
          .update({
            api_key: apiKey.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id)
          .select();

        console.log('[BotconversaConfig] Resposta update:', { data, error: updateError });

        if (updateError) throw updateError;
        result = data?.[0] || null;
      } else {
        console.log('[BotconversaConfig] Criando nova config');

        const { data, error: insertError } = await supabase
          .from('botconversa_config')
          .insert({
            organization_id: organizationId,
            api_key: apiKey.trim(),
            created_by: user.data.user.id,
          })
          .select();

        console.log('[BotconversaConfig] Resposta insert:', { data, error: insertError });

        if (insertError) throw insertError;
        result = data?.[0] || null;
      }

      console.log('[BotconversaConfig] Salvo com sucesso:', result?.id);
      setConfig(result);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      console.error('[BotconversaConfig] Erro:', msg, err);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (): Promise<boolean> => {
    if (!config?.id) return false;

    setLoading(true);

    try {
      console.log('[BotconversaConfig] Deletando:', config.id);

      const { error: deleteError } = await supabase
        .from('botconversa_config')
        .delete()
        .eq('id', config.id);

      console.log('[BotconversaConfig] Resposta delete:', { error: deleteError });

      if (deleteError) throw deleteError;
      setConfig(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao deletar';
      console.error('[BotconversaConfig] Erro ao deletar:', msg);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[BotconversaConfig] useEffect: organizationId =', organizationId);
    if (organizationId) {
      loadConfig();
    }
  }, [organizationId]);

  return { config, loading, error, saveConfig, deleteConfig, reload: loadConfig };
};
