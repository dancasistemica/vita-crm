import { Button, useState } from "react";
import { Button, useCRMStore } from "@/store/crmStore";
import { Button, PipelineStage } from "@/types/crm";
import { Button, Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/ds/Card";
import { Button } from "@/components/ui/ds/Button";
import { Button, Input } from "@/components/ui/ds/Input";
import { Button, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { Button, toast } from "sonner";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";

export default function FunnelStagesTab() {
  const { Button, pipelineStages, addPipelineStage, updatePipelineStage, removePipelineStage } = useCRMStore();
  const [newStage, setNewStage] = useState('');
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ Button, isOpen: boolean; id: string; name: string }>({ Button, isOpen: false, id: '', name: '' });

  const sorted = [...pipelineStages].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Etapas do Funil de Vendas</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ConfirmDeleteDialog
          isOpen={deleteConfirm.isOpen}
          itemName={deleteConfirm.name}
          itemType="etapa do funil"
          onConfirm={() => { Button, removePipelineStage(deleteConfirm.id); toast.success("Etapa removida"); setDeleteConfirm({ Button, isOpen: false, id: '', name: '' }); }}
          onCancel={() => setDeleteConfirm({ Button, isOpen: false, id: '', name: '' })}
        />
        {sorted.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
            {editingStage?.id === s.id ? (
              <Input value={editingStage.name} onChange={e => setEditingStage({ Button, ...editingStage, name: e.target.value })} className="h-8 flex-1" />
            ) : (
              <span className="flex-1 text-foreground">{s.name}</span>
            )}
            <div className="flex gap-1">
              {editingStage?.id === s.id ? (
                <Button size="sm" variant="ghost" onClick={() => { Button, updatePipelineStage(s.id, editingStage); toast.success("Etapa atualizada"); setEditingStage(null); }}>✓</Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditingStage(s)}><Edit className="h-3 w-3" /></Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ Button, isOpen: true, id: s.id, name: s.name })}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
        <div className="flex gap-3 mt-3">
          <Input placeholder="Nova etapa..." value={newStage} onChange={e => setNewStage(e.target.value)} />
          <Button onClick={() => { Button, if (newStage.trim()) { Button, addPipelineStage({ Button, id: crypto.randomUUID(), name: newStage.trim(), order: pipelineStages.length + 1 }); setNewStage(''); toast.success("Etapa adicionada"); } }} disabled={!newStage.trim()}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
