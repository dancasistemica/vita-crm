import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getRecoveryContextFromUrl } from '@/utils/authRecovery';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { hasTokenHash, type } = getRecoveryContextFromUrl(window.location);
  const isRecoveryFlow = (type === 'recovery' || hasTokenHash) && window.location.pathname !== '/reset-password';

  if (loading || isRecoveryFlow) {
    if (isRecoveryFlow) {
      console.log('[ProtectedRoute] Recovery detectado, aguardando redirecionamento para /reset-password');
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-neutral-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  // Adicionar log para debug de acesso a rotas
  const location = useLocation();
  console.log(`[ProtectedRoute] Acessando rota: ${location.pathname}${location.search}`);

  if (location.pathname === '/registro-presenca') {
    console.log('[ProtectedRoute] Permitindo acesso a /registro-presenca');
  }

  console.log('[ProtectedRoute] Usuário autenticado, liberando rota protegida');
  return <Outlet />;
}
