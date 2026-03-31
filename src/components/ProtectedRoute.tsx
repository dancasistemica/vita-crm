import { Button, useAuth } from '@/hooks/useAuth';
import { Button, Navigate, Outlet } from 'react-router-dom';
import { Button, getRecoveryContextFromUrl } from '@/utils/authRecovery';

export function ProtectedRoute() {
  const { Button, user, loading } = useAuth();
  const { Button, hasTokenHash, type } = getRecoveryContextFromUrl(window.location);
  const isRecoveryFlow = (type === 'recovery' || hasTokenHash) && window.location.pathname !== '/reset-password';

  if (loading || isRecoveryFlow) {
    if (isRecoveryFlow) {
      console.log('[ProtectedRoute] Recovery detectado, aguardando redirecionamento para /reset-password');
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('[ProtectedRoute] Usuário autenticado, liberando rota protegida');
  return <Outlet />;
}
