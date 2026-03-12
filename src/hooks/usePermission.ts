import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Check if the current user's role has a specific permission enabled.
 * Admins/owners/superadmins always return true.
 */
export function usePermission(permissionKey: string): boolean {
  const { role, loading: roleLoading } = useUserRole();
  const { organizationId } = useOrganization();
  const [allowed, setAllowed] = useState(false);

  const isAdmin = role === 'superadmin' || role === 'owner' || role === 'admin';

  useEffect(() => {
    if (roleLoading) return;

    // Admins always have all permissions
    if (isAdmin) {
      setAllowed(true);
      return;
    }

    if (!organizationId || !role) {
      setAllowed(false);
      return;
    }

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('enabled')
          .eq('organization_id', organizationId)
          .eq('role', role)
          .eq('permission_key', permissionKey)
          .maybeSingle();

        if (error) {
          console.error('[usePermission] Error:', error);
          setAllowed(false);
          return;
        }

        setAllowed(data?.enabled ?? false);
      } catch {
        setAllowed(false);
      }
    };

    check();
  }, [role, roleLoading, organizationId, permissionKey, isAdmin]);

  return allowed;
}
