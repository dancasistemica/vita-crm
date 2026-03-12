import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { DataAccessService, createDataAccessService } from '@/services/dataAccessService';

export function useDataAccess(): DataAccessService | null {
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  return useMemo(() => {
    if (!organizationId || !user?.id) return null;
    return createDataAccessService(organizationId, user.id);
  }, [organizationId, user?.id]);
}
