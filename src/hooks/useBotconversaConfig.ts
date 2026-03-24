import { useCallback, useEffect, useState } from 'react';
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

  const loadConfig = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('botconversa_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (queryError) throw queryError;
      setConfig(data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const saveConfig = async (apiKey: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (!apiKey.trim()) throw new Error('Chave API obrigatoria');

      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Usuario nao autenticado');

      let result: BotconversaConfig | null = null;

      if (config?.id) {
        const { data, error: updateError } = await supabase
          .from('botconversa_config')
          .update({ api_key: apiKey.trim(), updated_at: new Date().toISOString() })
          .eq('id', config.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('botconversa_config')
          .insert({
            organization_id: organizationId,
            api_key: apiKey.trim(),
            created_by: user.data.user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      setConfig(result);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (): Promise<boolean> => {
    if (!config?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('botconversa_config')
        .delete()
        .eq('id', config.id);

      if (deleteError) throw deleteError;
      setConfig(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { config, loading, error, saveConfig, deleteConfig, reload: loadConfig };
};
