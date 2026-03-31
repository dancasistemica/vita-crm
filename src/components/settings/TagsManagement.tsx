import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader, AlertTriangle } from 'lucide-react';
import { tagsService } from '@/services/tagsService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  created_at: string;
}

export const TagsManagement = () => {
  const { organization } = useOrganization();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    if (!organization?.id) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[TagsManagement] Carregando tags para org:', organization.id);
      const tagsData = await tagsService.listTagsWithUsage(organization.id);
      setTags(tagsData);
      console.log('[TagsManagement] Tags carregadas:', tagsData.length);
    } catch (error) {
      console.error('[TagsManagement] Erro ao carregar tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    if (!organization?.id) return;

    const orgId = organization.id;
    console.log('[TagsManagement] Assinando realtime de tags e lead_tags:', orgId);

    const tagsChannel = supabase
      .channel(`tags:org:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags', filter: `organization_id=eq.${orgId}` },
        () => {
          console.log('[TagsManagement] Realtime: tags alteradas');
          loadTags();
        }
      )
      .subscribe();

    const leadTagsChannel = supabase
      .channel(`lead_tags:org:${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_tags' }, () => {
        console.log('[TagsManagement] Realtime: lead_tags alteradas');
        loadTags();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tagsChannel);
      supabase.removeChannel(leadTagsChannel);
    };
  }, [organization?.id, loadTags]);

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !organization?.id) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[TagsManagement] Criando tag:', newTagName);
      await tagsService.createTag(organization.id, newTagName, newTagColor);
      setNewTagName('');
      setNewTagColor('#3b82f6');
      toast.success('Tag criada com sucesso');
      await loadTags();
    } catch (error) {
      console.error('[TagsManagement] Erro ao criar tag:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tag');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTag = async (tagId: string) => {
    if (!editName.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[TagsManagement] Editando tag:', tagId);
      await tagsService.updateTag(tagId, {
        name: editName,
        color: editColor,
      });
      setEditingId(null);
      toast.success('Tag atualizada com sucesso');
      await loadTags();
    } catch (error) {
      console.error('[TagsManagement] Erro ao editar tag:', error);
      toast.error('Erro ao editar tag');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!tagId) {
      console.error('[TagsManagement] ❌ ID da tag inválido');
      toast.error('ID da tag inválido');
      return;
    }

    console.log('[TagsManagement] Iniciando deleção de tag:', tagId);
    setIsSaving(true);
    setDeleteError(null);

    try {
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) {
        throw new Error('Tag não encontrada');
      }

      console.log('[TagsManagement] Deletando tag:', tag.name);
      await tagsService.deleteTag(tagId);
      console.log('[TagsManagement] ✅ Tag deletada com sucesso');
      setShowDeleteModal(null);
      setDeleteError(null);
      toast.success(`Tag "${tag.name}" deletada com sucesso`);
      await loadTags();
    } catch (error) {
      console.error('[TagsManagement] ❌ Erro ao deletar tag:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao deletar tag';

      setDeleteError(errorMessage);
      toast.error(`Erro ao deletar tag: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Gerenciar Tags</h2>
        <p className="text-neutral-600 mt-1">Crie, edite e delete tags para organizar seus leads</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nova Tag
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Nome da tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 px-3 py-2 min-h-[44px] border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="w-12 h-11 border border-neutral-300 rounded-md cursor-pointer"
          />
          <button
            onClick={handleCreateTag}
            disabled={isSaving}
            className="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader className="w-4 h-4 animate-spin" />}
            Criar
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible">
        {tags.length === 0 ? (
          <div className="text-center p-8 bg-neutral-50 rounded-lg">
            <p className="text-neutral-600">Nenhuma tag criada ainda</p>
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:shadow-md transition-shadow"
            >
              {editingId === tag.id ? (
                <div className="flex-1 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 min-h-[44px] border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-12 h-11 border border-neutral-300 rounded-md cursor-pointer"
                  />
                  <button
                    onClick={() => handleEditTag(tag.id)}
                    disabled={isSaving}
                    className="px-4 py-2 min-h-[44px] bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={isSaving}
                    className="px-4 py-2 min-h-[44px] bg-gray-300 text-neutral-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div>
                      <p className="font-medium text-neutral-900">{tag.name}</p>
                      <p className="text-sm text-neutral-500">
                        Usado em {tag.usageCount} {tag.usageCount === 1 ? 'lead' : 'leads'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditName(tag.name);
                        setEditColor(tag.color || '#3b82f6');
                      }}
                      className="p-2 min-h-[44px] min-w-[44px] text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar tag"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(tag.id);
                        setDeleteError(null);
                      }}
                      className="p-2 min-h-[44px] min-w-[44px] text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Deletar tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-semibold text-neutral-900">Deletar Tag</h2>
            </div>

            <div className="p-4">
              <p className="text-neutral-700 mb-2">
                Tem certeza que deseja deletar esta tag?
              </p>
              <p className="text-sm text-neutral-500">
                ⚠️ A tag será removida de todos os leads que a usam.
              </p>
              {deleteError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                  <p className="font-semibold mb-1">❌ Erro ao deletar:</p>
                  <p>{deleteError}</p>
                </div>
              )}
            </div>

            <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(null);
                  setDeleteError(null);
                }}
                disabled={isSaving}
                className="px-4 py-2 min-h-[44px] bg-gray-300 text-neutral-800 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteTag(showDeleteModal)}
                disabled={isSaving}
                className="px-4 py-2 min-h-[44px] bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                {deleteError ? 'Tentar Novamente' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
