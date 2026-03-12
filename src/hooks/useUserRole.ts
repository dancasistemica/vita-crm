import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { UserRole } from '@/services/permissionService';
import * as perms from '@/services/permissionService';

interface UseUserRoleReturn {
  role: UserRole;
  loading: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAccessSettings: boolean;
  isSuperadmin: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const { organizationId, loading: orgLoading } = useOrganization();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || orgLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const resolve = async () => {
      try {
        // Check superadmin first
        const { data: sa } = await supabase
          .from('superadmin_roles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (sa) {
          setRole('superadmin');
          setLoading(false);
          return;
        }

        // Check org role
        if (organizationId) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
            .maybeSingle();

          setRole((member?.role as UserRole) || 'member');
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('[useUserRole] Error:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [user, authLoading, organizationId, orgLoading]);

  return {
    role,
    loading,
    canCreate: perms.canCreate(role),
    canEdit: perms.canEdit(role),
    canDelete: perms.canDelete(role),
    canAccessSettings: perms.canAccessSettings(role),
    isSuperadmin: role === 'superadmin',
  };
}
