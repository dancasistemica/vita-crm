import { supabase } from '@/integrations/supabase/client';

export const tagsService = {
  // Listar todas as tags com contagem de uso
  listTagsWithUsage: async (organizationId: string) => {
    try {
      console.log('[TagsService] Listando tags para org:', organizationId);

      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('id, name, color, created_at')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (tagsError) {
        console.error('[TagsService] Erro ao buscar tags:', tagsError);
        throw tagsError;
      }

      if (!tags || tags.length === 0) {
        console.log('[TagsService] Nenhuma tag encontrada');
        return [];
      }

      const tagsWithUsage = await Promise.all(
        tags.map(async (tag) => {
          const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .contains('tags', [tag.name]);

          if (countError) {
            console.error(`[TagsService] Erro ao contar leads para tag ${tag.id}:`, countError);
            return { ...tag, usageCount: 0 };
          }

          console.log(`[TagsService] Tag "${tag.name}" (${tag.id}): ${count || 0} leads`);

          return {
            ...tag,
            usageCount: count || 0,
          };
        })
      );

      console.log('[TagsService] Tags carregadas com contagem:', tagsWithUsage.length);
      return tagsWithUsage;
    } catch (error) {
      console.error('[TagsService] Erro ao listar tags:', error);
      throw error;
    }
  },

  // Criar nova tag
  createTag: async (organizationId: string, name: string, color?: string) => {
    try {
      const tagName = name.trim().toLowerCase();
      console.log('[TagsService] Criando tag:', tagName);

      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', tagName)
        .maybeSingle();

      if (existing) {
        console.warn('[TagsService] Tag já existe:', tagName);
        throw new Error('Esta tag já existe');
      }

      const { data: newTag, error } = await supabase
        .from('tags')
        .insert({
          organization_id: organizationId,
          name: tagName,
          color: color || '#3b82f6',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[TagsService] Tag criada:', newTag.id);
      return newTag;
    } catch (error) {
      console.error('[TagsService] Erro ao criar tag:', error);
      throw error;
    }
  },

  // Atualizar tag
  updateTag: async (tagId: string, updates: { name?: string; color?: string }) => {
    try {
      console.log('[TagsService] Atualizando tag:', tagId);

      const updateData: { name?: string; color?: string } = {};
      if (updates.name) {
        updateData.name = updates.name.trim().toLowerCase();
      }
      if (updates.color) {
        updateData.color = updates.color;
      }

      const { data: updated, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', tagId)
        .select()
        .single();

      if (error) throw error;

      console.log('[TagsService] Tag atualizada:', tagId);
      return updated;
    } catch (error) {
      console.error('[TagsService] Erro ao atualizar tag:', error);
      throw error;
    }
  },

  // Deletar tag
  deleteTag: async (tagId: string) => {
    try {
      console.log('[TagsService] Deletando tag:', tagId);

      // Tags are stored as text[] on leads, no separate lead_tags table
      console.log('[TagsService] Nota: tags são armazenadas como array no lead, sem tabela de relacionamento separada');

      console.log('[TagsService] Deletando tag da tabela tags...');

      const { error: deleteTagError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (deleteTagError) {
        console.error('[TagsService] ❌ Erro ao deletar tag:', deleteTagError);
        throw new Error(`Erro ao deletar tag: ${deleteTagError.message}`);
      }

      console.log('[TagsService] ✅ Tag deletada com sucesso:', tagId);
      return true;
    } catch (error) {
      console.error('[TagsService] ❌ Erro crítico ao deletar tag:', error);
      throw error;
    }
  },
};
