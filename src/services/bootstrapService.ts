import { supabase } from '@/integrations/supabase/client';

export async function hasSuperadmin(): Promise<boolean> {
  try {
    console.log('[BootstrapService] Verificando superadmins existentes');
    const { data, error } = await supabase.rpc('has_any_superadmin');
    if (error) throw error;
    console.log('[BootstrapService] Superadmin existe:', data);
    return !!data;
  } catch (error) {
    console.error('[BootstrapService] Erro ao verificar:', error);
    return false;
  }
}

export async function createFirstSuperadmin(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[BootstrapService] Criando primeiro superadmin:', email);

    // 1. Check if superadmin already exists
    const exists = await hasSuperadmin();
    if (exists) {
      return { success: false, message: 'Já existe um superadmin cadastrado' };
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) throw authError;
    if (!authData.user?.id) throw new Error('Erro ao criar usuário');

    // 3. Bootstrap superadmin role (SECURITY DEFINER bypasses RLS)
    const { error: roleError } = await supabase.rpc('bootstrap_first_superadmin', {
      _user_id: authData.user.id,
    });

    if (roleError) throw roleError;

    // 4. Sign out so user logs in fresh
    await supabase.auth.signOut();

    console.log('[BootstrapService] Primeiro superadmin criado com sucesso');
    return {
      success: true,
      message: 'Superadmin criado! Verifique seu email para confirmar e depois faça login.',
    };
  } catch (error) {
    console.error('[BootstrapService] Erro ao criar superadmin:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar superadmin',
    };
  }
}
