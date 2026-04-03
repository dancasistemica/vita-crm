import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Validar que variáveis de ambiente existem
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Variáveis de ambiente não configuradas. Verifique seu arquivo .env');
}

// Criar cliente Supabase com configurações de segurança
// Fallback para strings vazias se as variáveis estiverem ausentes para evitar crash no top-level
export const supabase = createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/web',
    },
  },
});

// Função para fazer logout seguro
export async function secureLogout(): Promise<void> {
  try {
    console.log('[Supabase] Fazendo logout seguro...');
    
    // Fazer logout no Supabase primeiro
    await supabase.auth.signOut();
    
    // Limpar localStorage depois para garantir que tudo seja removido
    localStorage.clear();
    
    console.log('[Supabase] Logout realizado com sucesso');
    window.location.href = '/auth'; // Redirecionar para login
  } catch (err) {
    console.error('[Supabase] Erro no logout seguro:', err);
    throw err;
  }
}

// Função para validar sessão
export async function validateSession(): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Supabase] Erro ao validar sessão:', error);
      return false;
    }
    
    return !!session;
  } catch (err) {
    console.error('[Supabase] Erro inesperado ao validar sessão:', err);
    return false;
  }
}
