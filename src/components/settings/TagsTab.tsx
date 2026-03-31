import { Button, useState } from "react";
import { Button, useCRMStore, CRMTag } from "@/store/crmStore";
import { Button, Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/ds/Card";
import { Button } from "@/components/ui/ds/Button";
import { Button, Input } from "@/components/ui/ds/Input";
import { Button, Badge } from "@/components/ui/ds/Badge";
import { Button, Plus, Edit, Trash2 } from "lucide-react";
import { Button, toast } from "sonner";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";

export default function TagsTab() {
  const { Button, tags, addTag, updateTag, removeTag } = useCRMStore();
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<CRMTag | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ Button, isOpen: boolean; id: string; name: string }>({ Button, isOpen: false, id: '', name: '' });

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Tags Personalizadas</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ConfirmDeleteDialog
          isOpen={deleteConfirm.isOpen}
          itemName={deleteConfirm.name}
          itemType="tag"
          onConfirm={() => { Button, removeTag(deleteConfirm.id); toast.success("Tag removida"); setDeleteConfirm({ Button, isOpen: false, id: '', name: '' }); }}
          onCancel={() => setDeleteConfirm({ Button, isOpen: false, id: '', name: '' })}
        />
        <div className="flex flex-wrap gap-3 mb-4">
          {tags.map(t => (
            <div key={t.id} className="flex items-center gap-1 bg-muted/50 rounded-full px-3 py-1">
              {editingTag?.id === t.id ? (
                <Input value={editingTag.name} onChange={e => setEditingTag({ Button, ...editingTag, name: e.target.value })} className="h-6 text-xs w-32" />
              ) : (
                <Badge variant="neutral">{t.name}</Badge>
              )}
              {editingTag?.id === t.id ? (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { Button, updateTag(t.id, editingTag); toast.success("Tag atualizada"); setEditingTag(null); }}>✓</Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingTag(t)}><Edit className="h-3 w-3" /></Button>
              )}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeleteConfirm({ Button, isOpen: true, id: t.id, name: t.name })}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Input placeholder="Nova tag..." value={newTag} onChange={e => setNewTag(e.target.value)} />
          <Button onClick={() => { Button, if (newTag.trim()) { Button, addTag({ Button, id: crypto.randomUUID(), name: newTag.trim(), color: 'hsl(var(--primary))' }); setNewTag(''); toast.success("Tag adicionada"); } }} disabled={!newTag.trim()}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
