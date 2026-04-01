import { useState } from "react";
import { useCRMStore, CRMTag } from "@/store/crmStore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui/ds";

export default function TagsTab() {
  const { tags, addTag, updateTag, removeTag } = useCRMStore();
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<CRMTag | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Tags Personalizadas</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ConfirmDeleteDialog
          isOpen={deleteConfirm.isOpen}
          itemName={deleteConfirm.name}
          itemType="tag"
          onConfirm={() => { removeTag(deleteConfirm.id); toast.success("Tag removida"); setDeleteConfirm({ isOpen: false, id: '', name: '' }); }}
          onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        />
        <div className="flex flex-wrap gap-3 mb-4">
          {tags.map(t => (
            <div key={t.id} className="flex items-center gap-1 bg-neutral-100 rounded-full px-3 py-1">
              {editingTag?.id === t.id ? (
                <Input value={editingTag.name} onChange={e => setEditingTag({ ...editingTag, name: e.target.value })} className="h-6 text-xs w-32" />
              ) : (
                <Badge variant="secondary">{t.name}</Badge>
              )}
              {editingTag?.id === t.id ? (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { updateTag(t.id, editingTag); toast.success("Tag atualizada"); setEditingTag(null); }}>✓</Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingTag(t)}><Edit className="h-3 w-3" /></Button>
              )}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-error-600" onClick={() => setDeleteConfirm({ isOpen: true, id: t.id, name: t.name })}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Input placeholder="Nova tag..." value={newTag} onChange={e => setNewTag(e.target.value)} />
          <Button onClick={() => { if (newTag.trim()) { addTag({ id: crypto.randomUUID(), name: newTag.trim(), color: 'hsl(var(--primary))' }); setNewTag(''); toast.success("Tag adicionada"); } }} disabled={!newTag.trim()}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
