import { supabase } from '@/integrations/supabase/client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    console.log('[LoginService] Tentando login:', credentials.email);

    if (!credentials.email || !credentials.password) {
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    const rateLimitCheck = checkRateLimit(credentials.email);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Muitas tentativas. Tente novamente em ${rateLimitCheck.minutesRemaining} minutos`,
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      console.error('[LoginService] Erro de autenticação:', authError.message);
      recordFailedLogin(credentials.email);

      if (authError.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Email ou senha incorretos' };
      }
      if (authError.message.includes('Email not confirmed')) {
        return { success: false, error: 'Confirme seu email antes de fazer login' };
      }
      return { success: false, error: 'Erro ao fazer login. Tente novamente mais tarde.' };
    }

    if (!authData.user?.id) {
      return { success: false, error: 'Erro ao fazer login' };
    }

    const userId = authData.user.id;

    // Check org membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (membership?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('active')
        .eq('id', membership.organization_id)
        .single();

      if (org && !org.active) {
        await supabase.auth.signOut();
        return { success: false, error: 'Sua organização está inativa' };
      }
    }

    // Determine redirect
    const { data: saCheck } = await supabase
      .from('superadmin_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let redirectUrl = '/';
    if (saCheck) {
      redirectUrl = '/superadmin';
    }

    console.log('[LoginService] Login bem-sucedido');
    clearFailedLogins(credentials.email);

    return { success: true, redirectUrl };
  } catch (error) {
    console.error('[LoginService] Erro inesperado:', error);
    return { success: false, error: 'Erro inesperado. Tente novamente mais tarde.' };
  }
}

// --- Rate Limiting ---

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export function checkRateLimit(email: string): { allowed: boolean; minutesRemaining?: number } {
  const key = `login_attempts_${email}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { allowed: true };

  const attempts = JSON.parse(raw) as { count: number; timestamp: number };
  const now = Date.now();

  if (now - attempts.timestamp > RATE_LIMIT_WINDOW_MS) {
    localStorage.removeItem(key);
    return { allowed: true };
  }

  if (attempts.count >= RATE_LIMIT_MAX) {
    const minutesRemaining = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - attempts.timestamp)) / 60000);
    return { allowed: false, minutesRemaining };
  }

  return { allowed: true };
}

function recordFailedLogin(email: string) {
  const key = `login_attempts_${email}`;
  const raw = localStorage.getItem(key);
  const attempts = raw ? JSON.parse(raw) as { count: number; timestamp: number } : { count: 0, timestamp: Date.now() };

  if (Date.now() - attempts.timestamp > RATE_LIMIT_WINDOW_MS) {
    attempts.count = 1;
    attempts.timestamp = Date.now();
  } else {
    attempts.count++;
  }

  localStorage.setItem(key, JSON.stringify(attempts));
  console.log('[LoginService] Tentativas registradas:', attempts.count);
}

function clearFailedLogins(email: string) {
  localStorage.removeItem(`login_attempts_${email}`);
}
