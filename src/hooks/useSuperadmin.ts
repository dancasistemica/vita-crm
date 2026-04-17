import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseSuperadminReturn {
  isSuperadmin: boolean;
  loading: boolean;
}

export function useSuperadmin(): UseSuperadminReturn {
  const { user, loading: authLoading } = useAuth();
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsSuperadmin(false);
      setLoading(false);
      return;
    }

    const checkSuperadmin = async () => {
      try {
        const { data, error } = await supabase.rpc('is_superadmin', { _user_id: user.id });

        if (error) {
          console.error('[useSuperadmin] Error checking role:', error);
          setIsSuperadmin(false);
        } else {
          setIsSuperadmin(!!data);
        }
      } catch (err) {
        console.error('[useSuperadmin] Unexpected error:', err);
        setIsSuperadmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperadmin();
  }, [user, authLoading]);

  return { isSuperadmin, loading };
}
