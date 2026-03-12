import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSuperadmin } from '@/hooks/useSuperadmin';

interface SwitchableOrg {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

const STORAGE_KEY = 'superadmin_current_org';

export function useOrganizationSwitch() {
  const { isSuperadmin, loading: saLoading } = useSuperadmin();
  const [organizations, setOrganizations] = useState<SwitchableOrg[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
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

  const switchOrganization = useCallback((orgId: string) => {
    console.log('[useOrganizationSwitch] Trocando para org:', orgId);
    localStorage.setItem(STORAGE_KEY, orgId);
    setCurrentOrgId(orgId);
    // Reload to apply new context everywhere
    window.location.reload();
  }, []);

  const currentOrganization = organizations.find(o => o.id === currentOrgId) || null;

  return {
    organizations,
    currentOrganization,
    currentOrgId,
    loading: loading || saLoading,
    isSuperadmin,
    switchOrganization,
  };
}
