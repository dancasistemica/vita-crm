import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { getNormalizedRecoveryRoute } from '@/utils/authRecovery';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        console.log('[useAuth] Auth Event:', event);
        console.log('[useAuth] Session:', nextSession);

        if (event === 'PASSWORD_RECOVERY') {
          const recoveryRoute = getNormalizedRecoveryRoute(window.location) ?? '/reset-password';
          console.log('[useAuth] PASSWORD_RECOVERY detectado!');
          console.log('[useAuth] Redirecionando para:', recoveryRoute);
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);

          if (window.location.pathname !== '/reset-password') {
            window.location.replace(recoveryRoute);
            return;
          }
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[useAuth] getSession:', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return { user, session, loading, signOut };
}
