import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { useOrganization } from '@/contexts/OrganizationContext';

interface SwitchableOrg {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

const STORAGE_KEY = 'superadmin_current_org';

export function useOrganizationSwitch() {
  const { isSuperadmin, loading: saLoading } = useSuperadmin();
  const { switchOrg, organizationId } = useOrganization();
  const [organizations, setOrganizations] = useState<SwitchableOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (saLoading) return;
    if (!isSuperadmin) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        console.log('[useOrganizationSwitch] Carregando todas as organizações');
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, description, logo_url')
          .order('name');

        if (error) {
          console.error('[useOrganizationSwitch] Erro:', error);
        } else {
          console.log('[useOrganizationSwitch] ✅ Orgs carregadas:', data?.length);
          setOrganizations(data || []);
        }
      } catch (err) {
        console.error('[useOrganizationSwitch] Erro inesperado:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isSuperadmin, saLoading]);

  const switchOrganization = useCallback(async (orgId: string) => {
    console.log('[useOrganizationSwitch] 🔄 Trocando para org:', orgId);
    // Delegate to context — updates localStorage + state + triggers re-render everywhere
    await switchOrg(orgId);
    console.log('[useOrganizationSwitch] ✅ switchOrg concluído');
  }, [switchOrg]);

  const currentOrganization = organizations.find(o => o.id === organizationId) || null;

  return {
    organizations,
    currentOrganization,
    currentOrgId: organizationId,
    loading: loading || saLoading,
    isSuperadmin,
    switchOrganization,
  };
}
