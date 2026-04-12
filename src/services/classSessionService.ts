import { supabase } from '@/integrations/supabase/client';

export interface ClassSession {
  id: string;
  organization_id: string;
  product_id: string;
  class_date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Criar ou atualizar sessão de aula
export const saveClassSession = async (
  organizationId: string,
  productId: string,
  classDate: string,
  description: string
): Promise<ClassSession> => {
  try {
    console.log('[classSessionService] Salvando sessão de aula:', {
      productId,
      classDate,
      descriptionLength: description.length,
    });

    // PASSO 1: Verificar se já existe sessão para esta data/produto
    const { data: existingSession, error: checkError } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // PASSO 2: Atualizar se existe, inserir se não existe
    if (existingSession?.id) {
      console.log('[classSessionService] Atualizando sessão existente:', existingSession.id);

      const { data, error } = await supabase
        .from('class_sessions')
        .update({
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      console.log('[classSessionService] Criando nova sessão');

      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          organization_id: organizationId,
          product_id: productId,
          class_date: classDate,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

  } catch (error) {
    console.error('[classSessionService] ❌ Erro ao salvar sessão:', error);
    throw error;
  }
};

// Buscar sessão de aula
export const fetchClassSession = async (
  organizationId: string,
  productId: string,
  classDate: string
): Promise<ClassSession | null> => {
  try {
    console.log('[classSessionService] Buscando sessão de aula');

    const { data, error } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      console.log('[classSessionService] ✅ Sessão encontrada');
      return data;
    }

    console.log('[classSessionService] ℹ️ Nenhuma sessão encontrada');
    return null;

  } catch (error) {
    console.error('[classSessionService] ❌ Erro ao buscar sessão:', error);
    throw error;
  }
};

// Deletar sessão de aula
export const deleteClassSession = async (sessionId: string) => {
  try {
    console.log('[classSessionService] Deletando sessão:', sessionId);

    const { error } = await supabase
      .from('class_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    console.log('[classSessionService] ✅ Sessão deletada');
    return true;

  } catch (error) {
    console.error('[classSessionService] ❌ Erro ao deletar sessão:', error);
    throw error;
  }
};
