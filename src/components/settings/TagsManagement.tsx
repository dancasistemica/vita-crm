import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Plus, Edit2, Trash2, Loader, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, Button, Input } from "@/components/ui/ds";

interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount?: number;
}

export const TagsManagement = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*');

      if (tagsError) throw tagsError;

      // Get usage count for each tag
      const { data: usageData, error: usageError } = await supabase
        .from('lead_tags')
        .select('tag_id');

      if (usageError) throw usageError;

      const counts = usageData.reduce((acc: any, curr: any) => {
        acc[curr.tag_id] = (acc[curr.tag_id] || 0) + 1;
        return acc;
      }, {});

      const tagsWithUsage = (tagsData || []).map(tag => ({
        ...tag,
        usageCount: counts[tag.id] || 0
      }));

      setTags(tagsWithUsage);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: newTagName.trim(), color: newTagColor }])
        .select()
        .single();

      if (error) throw error;

      setTags([{ ...data, usageCount: 0 }, ...tags]);
      setNewTagName('');
      setNewTagColor('#3b82f6');
      toast.success('Tag criada com sucesso');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTag = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('tags')
        .update({ name: editName.trim(), color: editColor })
        .eq('id', id);

      if (error) throw error;

      setTags(tags.map(tag => tag.id === id ? { ...tag, name: editName, color: editColor } : tag));
      setEditingId(null);
      toast.success('Tag atualizada com sucesso');
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Erro ao atualizar tag');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      setIsSaving(true);
      setDeleteError(null);
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTags(tags.filter(tag => tag.id !== id));
      setShowDeleteModal(null);
      toast.success('Tag deletada com sucesso');
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      setDeleteError(error.message || 'Erro ao deletar tag');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Gerenciar Tags</h2>
        <p className="text-neutral-600 mt-1">Crie, edite e delete tags para organizar seus leads</p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5" />
          Nova Tag
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Nome da tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="w-12 h-11 border border-neutral-300 rounded-md cursor-pointer"
          />
          <Button
            onClick={handleCreateTag}
            disabled={isSaving}
          >
            {isSaving && <Loader className="w-4 h-4 animate-spin mr-2" />}
            Criar
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible">
        {tags.length === 0 ? (
          <div className="text-center p-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
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
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-12 h-11 border border-neutral-300 rounded-md cursor-pointer"
                  />
                  <Button
                    onClick={() => handleEditTag(tag.id)}
                    disabled={isSaving}
                    variant="primary"
                  >
                    Salvar
                  </Button>
                  <Button
                    onClick={() => setEditingId(null)}
                    disabled={isSaving}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
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

                  <div className="flex gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditName(tag.name);
                        setEditColor(tag.color || '#3b82f6');
                      }}
                      title="Editar tag"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-error-600"
                      onClick={() => {
                        setShowDeleteModal(tag.id);
                        setDeleteError(null);
                      }}
                      title="Deletar tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
            <div className="bg-error-50 border-b border-error-200 p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-error-600" />
              <h2 className="text-xl font-semibold text-neutral-900">Deletar Tag</h2>
            </div>

            <div className="p-4">
              <p className="text-neutral-700 mb-2">
                Tem certeza que deseja deletar esta tag?
              </p>
              <p className="text-sm text-neutral-500">
                ⚠️ A tag será removida de todos os leads que a usam.
              </p>
              {deleteError && (
                <div className="mt-4 p-3 bg-error-100 border border-error-300 text-error-700 rounded-md text-sm">
                  <p className="font-semibold mb-1">❌ Erro ao deletar:</p>
                  <p>{deleteError}</p>
                </div>
              )}
            </div>

            <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(null);
                  setDeleteError(null);
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                variant="error"
                onClick={() => handleDeleteTag(showDeleteModal)}
                disabled={isSaving}
              >
                {isSaving && <Loader className="w-4 h-4 animate-spin mr-2" />}
                {deleteError ? 'Tentar Novamente' : 'Deletar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
