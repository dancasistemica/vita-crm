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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      // Check if superadmin has a saved org override
      const { data: saRole } = await supabase
        .from('superadmin_roles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const superadminOrgId = saRole ? localStorage.getItem('superadmin_current_org') : null;

      let targetOrgId: string | null = null;

      if (superadminOrgId) {
        console.log('[OrganizationContext] SuperAdmin override org:', superadminOrgId);
        targetOrgId = superadminOrgId;
      } else {
        // Get user's first organization via membership
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        targetOrgId = membership?.organization_id || null;
      }

      if (!targetOrgId) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', targetOrgId)
        .maybeSingle();

      setOrganization(org as Organization | null);
    } catch (error) {
      console.error('[OrganizationContext] Error fetching org:', error);
      setOrganization(null);
    } finally {
      setLoading(false);
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
