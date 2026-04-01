import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Validar que variáveis de ambiente existem
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Variáveis de ambiente não configuradas');
  throw new Error(
    'Supabase URL e ANON_KEY são obrigatórios. Verifique seu arquivo .env'
  );
}

// Validar formato da URL
if (!supabaseUrl.startsWith('https://')) {
  console.error('[Supabase] URL deve usar HTTPS');
  throw new Error('Supabase URL deve usar HTTPS');
}

// Criar cliente Supabase com configurações de segurança
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Não expor dados sensíveis em logs
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
    const { error } = await supabase.auth.signOut();
    
    // Limpar localStorage depois para garantir que tudo seja removido
    localStorage.clear();
    
    if (error) {
      console.error('[Supabase] Erro ao fazer logout:', error);
      throw error;
    }
    
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
