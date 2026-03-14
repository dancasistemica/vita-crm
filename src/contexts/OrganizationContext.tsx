import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const CONSOLIDATED_ORG_ID = 'consolidado';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  plan: 'free' | 'starter' | 'pro' | 'agency';
  max_users: number;
  max_leads: number;
  active: boolean;
}

const CONSOLIDATED_ORG: Organization = {
  id: CONSOLIDATED_ORG_ID,
  name: '🌐 Consolidado (Todas as Orgs)',
  slug: 'consolidado',
  logo_url: null,
  primary_color: '#3B82F6',
  plan: 'agency',
  max_users: 9999,
  max_leads: 9999,
  active: true,
};

interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizationId: null,
  loading: true,
  refetch: async () => {},
  switchOrg: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrgById = useCallback(async (orgId: string) => {
    console.log('[OrganizationContext] loadOrgById:', orgId);
    setLoading(true);
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();

      if (error) {
        console.error('[OrganizationContext] ❌ Erro ao carregar org:', error);
      }
      console.log('[OrganizationContext] ✅ Org carregada:', org?.id, org?.name);
      setOrganization(org as Organization | null);
    } catch (err) {
      console.error('[OrganizationContext] ❌ Erro geral:', err);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganization = useCallback(async () => {
    console.log('[OrganizationContext] 1️⃣ fetchOrganization iniciado');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[OrganizationContext] ⚠️ Sem user autenticado');
        setOrganization(null);
        setLoading(false);
        return;
      }

      const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: user.id });
      console.log('[OrganizationContext] 2️⃣ isSuperadmin:', isSuperadmin);

      const superadminOrgId = isSuperadmin ? localStorage.getItem('superadmin_current_org') : null;
      console.log('[OrganizationContext] 3️⃣ superadminOrgId:', superadminOrgId);

      let targetOrgId: string | null = null;

      if (superadminOrgId === CONSOLIDATED_ORG_ID) {
        console.log('[OrganizationContext] ✅ Restaurando modo CONSOLIDADO do localStorage');
        setOrganization(CONSOLIDATED_ORG);
        setLoading(false);
        return;
      } else if (superadminOrgId) {
        targetOrgId = superadminOrgId;
      } else if (isSuperadmin) {
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .order('name', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstOrg?.id) {
          targetOrgId = firstOrg.id;
          localStorage.setItem('superadmin_current_org', firstOrg.id);
        }
      } else {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        targetOrgId = membership?.organization_id || null;
      }

      console.log('[OrganizationContext] 4️⃣ targetOrgId:', targetOrgId);

      if (!targetOrgId) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      await loadOrgById(targetOrgId);
    } catch (error) {
      console.error('[OrganizationContext] ❌ Erro geral:', error);
      setOrganization(null);
      setLoading(false);
    }
  }, [loadOrgById]);

  // Called by the org switcher — updates localStorage, state, and re-fetches org
  const switchOrg = useCallback(async (orgId: string) => {
    console.log('[OrganizationContext] 🔄 switchOrg chamado:', orgId);
    localStorage.setItem('superadmin_current_org', orgId);
    if (orgId === CONSOLIDATED_ORG_ID) {
      console.log('[OrganizationContext] ✅ Modo CONSOLIDADO ativado');
      setOrganization(CONSOLIDATED_ORG);
      setLoading(false);
    } else {
      await loadOrgById(orgId);
    }
  }, [loadOrgById]);

  useEffect(() => {
    fetchOrganization();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOrganization();
    });

    return () => subscription.unsubscribe();
  }, [fetchOrganization]);

  useEffect(() => {
    console.log('[OrganizationContext] ✅ organization →', organization?.id, organization?.name);
  }, [organization]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: organization?.id || null,
        loading,
        refetch: fetchOrganization,
        switchOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
