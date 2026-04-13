import { supabase } from "@/integrations/supabase/client";

export interface Integration {
  id: string;
  organization_id: string;
  integration_type: string;
  name: string;
  description: string;
  is_active: boolean;
  credentials: {
    api_key?: string;
    api_url?: string;
    webhook_secret?: string;
  };
  sync_config: {
    auto_sync: boolean;
    sync_interval_hours: number;
    last_sync: string;
    next_sync: string;
  };
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const saveIntegration = async (
  organizationId: string,
  integration: Partial<Integration>
): Promise<Integration> => {
  try {
    console.log('[integrationService] Salvando integração:', integration.integration_type);

    const { data, error } = await supabase
      .from('integrations')
      .upsert({
        organization_id: organizationId,
        integration_type: integration.integration_type || '',
        name: integration.name || '',
        description: integration.description || '',
        is_active: integration.is_active !== false,
        credentials: integration.credentials || {},
        sync_config: integration.sync_config || {
          auto_sync: false,
          sync_interval_hours: 24,
          last_sync: '',
          next_sync: ''
        },
        status: integration.status || 'pending',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id, integration_type'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[integrationService] ✅ Integração salva:', data);
    return data as unknown as Integration;
  } catch (error) {
    console.error('[integrationService] ❌ Erro ao salvar integração:', error);
    throw error;
  }
};

export const getIntegrations = async (
  organizationId: string
): Promise<Integration[]> => {
  try {
    console.log('[integrationService] Buscando integrações');

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('[integrationService] ✅ Integrações encontradas:', data?.length || 0);
    return (data || []) as unknown as Integration[];
  } catch (error) {
    console.error('[integrationService] ❌ Erro ao buscar integrações:', error);
    throw error;
  }
};

export const updateIntegrationStatus = async (
  integrationId: string,
  status: string,
  errorMessage?: string
): Promise<void> => {
  try {
    console.log('[integrationService] Atualizando status:', { integrationId, status });

    const { error } = await supabase
      .from('integrations')
      .update({
        status,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);

    if (error) throw error;

    console.log('[integrationService] ✅ Status atualizado');
  } catch (error) {
    console.error('[integrationService] ❌ Erro ao atualizar status:', error);
    throw error;
  }
};
