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
    console.log('[BotconversaConfig.loadConfig] INICIANDO');
    console.log('[BotconversaConfig.loadConfig] organizationId:', organizationId);

    if (!organizationId) {
      console.log('[BotconversaConfig.loadConfig] organizationId vazio, abortando');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[BotconversaConfig.loadConfig] Iniciando query...');

      const { data, error: queryError, status } = await supabase
        .from('botconversa_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      console.log('[BotconversaConfig.loadConfig] Query retornou:', {
        status,
        dataExists: !!data,
        errorCode: queryError?.code,
        errorMessage: queryError?.message,
        errorDetails: queryError?.details,
      });

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          console.log('[BotconversaConfig.loadConfig] Nenhuma config encontrada (PGRST116 - esperado)');
          setConfig(null);
          setLoading(false);
          return;
        }

        console.error('[BotconversaConfig.loadConfig] Erro na query:', {
          code: queryError.code,
          message: queryError.message,
          details: queryError.details,
          status: queryError.status,
        });
        throw new Error(`Query error [${queryError.code}]: ${queryError.message}`);
      }

      console.log('[BotconversaConfig.loadConfig] Dados carregados com sucesso:', data?.id);
      setConfig(data || null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('[BotconversaConfig.loadConfig] ERRO CAPTURADO:', {
        message: errorObj.message,
        stack: errorObj.stack,
        type: errorObj.constructor.name,
      });
      setError(errorObj.message);
    } finally {
      setLoading(false);
      console.log('[BotconversaConfig.loadConfig] FINALIZADO');
    }
  };

  const saveConfig = async (apiKey: string): Promise<boolean> => {
    console.log('[BotconversaConfig.saveConfig] INICIANDO');

    setLoading(true);
    setError(null);

    try {
      if (!apiKey.trim()) {
        throw new Error('Chave API obrigatória');
      }

      console.log('[BotconversaConfig.saveConfig] Validações OK');

      const user = await supabase.auth.getUser();
      console.log('[BotconversaConfig.saveConfig] User:', user.data.user?.id);

      if (!user.data.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      let result: BotconversaConfig | undefined;

      if (config?.id) {
        console.log('[BotconversaConfig.saveConfig] Atualizando config:', config.id);

        const { data, error: updateError } = await supabase
          .from('botconversa_config')
          .update({
            api_key: apiKey.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id)
          .select();

        console.log('[BotconversaConfig.saveConfig] Update response:', {
          success: !updateError,
          errorCode: updateError?.code,
          errorMessage: updateError?.message,
        });

        if (updateError) throw updateError;
        result = data?.[0];
      } else {
        console.log('[BotconversaConfig.saveConfig] Criando nova config');

        const { data, error: insertError } = await supabase
          .from('botconversa_config')
          .insert({
            organization_id: organizationId,
            api_key: apiKey.trim(),
            created_by: user.data.user.id,
          })
          .select();

        console.log('[BotconversaConfig.saveConfig] Insert response:', {
          success: !insertError,
          errorCode: insertError?.code,
          errorMessage: insertError?.message,
        });

        if (insertError) throw insertError;
        result = data?.[0];
      }

      console.log('[BotconversaConfig.saveConfig] Salvo com sucesso:', result?.id);
      setConfig(result || null);
      return true;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('[BotconversaConfig.saveConfig] ERRO:', {
        message: errorObj.message,
        stack: errorObj.stack,
      });
      setError(errorObj.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (): Promise<boolean> => {
    console.log('[BotconversaConfig.deleteConfig] INICIANDO');

    if (!config?.id) {
      console.log('[BotconversaConfig.deleteConfig] Sem config para deletar');
      return false;
    }

    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('botconversa_config')
        .delete()
        .eq('id', config.id);

      console.log('[BotconversaConfig.deleteConfig] Delete response:', {
        success: !deleteError,
        errorCode: deleteError?.code,
      });

      if (deleteError) throw deleteError;
      setConfig(null);
      return true;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('[BotconversaConfig.deleteConfig] ERRO:', errorObj.message);
      setError(errorObj.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[BotconversaConfig] useEffect disparado, organizationId:', organizationId);
    if (organizationId) {
      loadConfig();
    }
  }, [organizationId]);

  return { config, loading, error, saveConfig, deleteConfig, reload: loadConfig };
};
