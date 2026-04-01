import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { PipelineStage } from "@/types/crm";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui/ds";

export default function FunnelStagesTab() {
  const { pipelineStages, addPipelineStage, updatePipelineStage, removePipelineStage } = useCRMStore();
  const [newStage, setNewStage] = useState('');
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  const sorted = [...pipelineStages].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapas do Funil</CardTitle>
        <CardDescription>Configure as etapas do seu processo de vendas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
            <GripVertical className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-500 w-6">{i + 1}.</span>
            {editingStage?.id === s.id ? (
              <Input value={editingStage.name} onChange={e => setEditingStage({ ...editingStage, name: e.target.value })} className="h-8 flex-1" />
            ) : (
              <span className="flex-1 text-neutral-900">{s.name}</span>
            )}
            <div className="flex gap-1">
              {editingStage?.id === s.id ? (
                <Button size="sm" variant="ghost" onClick={() => { updatePipelineStage(s.id, editingStage); toast.success("Etapa atualizada"); setEditingStage(null); }}>
                  ✓
                </Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditingStage(s)}>
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 text-error-600" onClick={() => setDeleteConfirm({ isOpen: true, id: s.id, name: s.name })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        <div className="flex gap-3 mt-3">
          <Input placeholder="Nova etapa..." value={newStage} onChange={e => setNewStage(e.target.value)} />
          <Button 
            onClick={() => { 
              if (newStage.trim()) { 
                addPipelineStage({ id: crypto.randomUUID(), name: newStage.trim(), order: pipelineStages.length + 1 }); 
                setNewStage(''); 
                toast.success("Etapa adicionada"); 
              } 
            }} 
            disabled={!newStage.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />Adicionar
          </Button>
        </div>
      </CardContent>

      <ConfirmDeleteDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={() => {
          removePipelineStage(deleteConfirm.id);
          toast.success("Etapa removida");
          setDeleteConfirm({ ...deleteConfirm, isOpen: false });
        }}
        title="Remover Etapa"
        description={`Tem certeza que deseja remover a etapa "${deleteConfirm.name}"? Leads nesta etapa ficarão sem etapa definida.`}
      />
    </Card>
  );
}
