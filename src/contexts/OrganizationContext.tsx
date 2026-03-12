import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
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

interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizationId: null,
  loading: true,
  refetch: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async () => {
    console.log('[OrganizationContext] 1️⃣ fetchOrganization iniciado');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[OrganizationContext] 2️⃣ user.id:', user?.id);
      if (!user) {
        console.warn('[OrganizationContext] ⚠️ Sem user autenticado');
        setOrganization(null);
        setLoading(false);
        return;
      }

      const { data: isSuperadmin, error: superadminError } = await supabase.rpc('is_superadmin', {
        _user_id: user.id,
      });
      console.log('[OrganizationContext] 3️⃣ isSuperadmin:', isSuperadmin, 'error:', superadminError?.message);

      const superadminOrgId = isSuperadmin ? localStorage.getItem('superadmin_current_org') : null;
      console.log('[OrganizationContext] 4️⃣ superadminOrgId do localStorage:', superadminOrgId);

      let targetOrgId: string | null = null;

      if (superadminOrgId) {
        console.log('[OrganizationContext] 5️⃣ Usando override do SuperAdmin:', superadminOrgId);
        targetOrgId = superadminOrgId;
      } else if (isSuperadmin) {
        console.log('[OrganizationContext] 5️⃣ SuperAdmin sem org salva, buscando primeira org...');
        const { data: firstOrg, error: firstOrgError } = await supabase
          .from('organizations')
          .select('id')
          .order('name', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstOrgError) {
          console.error('[OrganizationContext] ❌ Erro ao buscar primeira org:', firstOrgError);
        }

        if (firstOrg?.id) {
          targetOrgId = firstOrg.id;
          localStorage.setItem('superadmin_current_org', firstOrg.id);
          console.log('[OrganizationContext] 6️⃣ Org padrão selecionada:', firstOrg.id);
        }
      } else {
        console.log('[OrganizationContext] 5️⃣ User normal, buscando membership...');
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        targetOrgId = membership?.organization_id || null;
        console.log('[OrganizationContext] 6️⃣ membership org:', targetOrgId);
      }

      console.log('[OrganizationContext] 7️⃣ targetOrgId final:', targetOrgId);

      if (!targetOrgId) {
        console.warn('[OrganizationContext] ⚠️ Nenhum targetOrgId encontrado');
        setOrganization(null);
        setLoading(false);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', targetOrgId)
        .maybeSingle();

      console.log('[OrganizationContext] 8️⃣ Org carregada:', org?.id, org?.name, 'error:', orgError?.message);
      setOrganization(org as Organization | null);
    } catch (error) {
      console.error('[OrganizationContext] ❌ Erro geral:', error);
      setOrganization(null);
    } finally {
      setLoading(false);
      console.log('[OrganizationContext] 9️⃣ fetchOrganization finalizado');
    }
  };

  useEffect(() => {
    fetchOrganization();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOrganization();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: organization?.id || null,
        loading,
        refetch: fetchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
