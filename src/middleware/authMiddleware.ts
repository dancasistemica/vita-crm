import { supabase, validateSession } from '@/lib/supabase';

/**
 * Middleware para validar autenticação em rotas ou ações específicas.
 * Pode ser expandido para incluir verificações de RBAC (Role-Based Access Control).
 */
export async function authMiddleware() {
  const isValid = await validateSession();
  
  if (!isValid) {
    console.warn('[AuthMiddleware] Sessão inválida ou expirada');
    // Em um ambiente React, o redirecionamento geralmente é feito via hooks ou ProtectedRoute
    // mas esta função pode ser usada para verificações imperativas.
    return { authenticated: false, user: null };
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  return { authenticated: true, user };
}

/**
 * Verifica se o usuário tem uma determinada role (exemplo de expansão)
 */
export async function checkPermission(requiredRole: string) {
  const { authenticated, user } = await authMiddleware();
  
  if (!authenticated || !user) return false;

  try {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return membership?.role === requiredRole;
  } catch (err) {
    console.error('[AuthMiddleware] Erro ao verificar permissão:', err);
    return false;
  }
}
