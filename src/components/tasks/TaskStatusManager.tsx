import { useState } from "react";
import { Button } from "@/components/ui/ds/Button";
import { Input } from "@/components/ui/ds/Input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/ds/Card";
import { Plus, Edit2, Trash2, X, Settings } from "lucide-react";
import { toast } from "sonner";

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface TaskStatusManagerProps {
  statuses: TaskStatus[];
  onCreateStatus: (data: { name: string; color: string; order_index: number }) => Promise<void>;
  onUpdateStatus: (id: string, data: { name: string; color: string }) => Promise<void>;
  onDeleteStatus: (id: string) => Promise<void>;
}

export default function TaskStatusManager({
  statuses,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
}: TaskStatusManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#6B7280" });

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await onUpdateStatus(editingId, form);
        toast.success("Status atualizado!");
      } else {
        await onCreateStatus({ ...form, order_index: statuses.length });
        toast.success("Status criado!");
      }
      setForm({ name: "", color: "#6B7280" });
      setEditingId(null);
      setShowForm(false);
    } catch {
      toast.error("Erro ao salvar status");
    }
  };

  const handleEdit = (s: TaskStatus) => {
    setEditingId(s.id);
    setForm({ name: s.name, color: s.color });
    setShowForm(true);
  };

  const handleDelete = async (s: TaskStatus) => {
    if (!confirm(`Deletar status "${s.name}"?`)) return;
    try {
      await onDeleteStatus(s.id);
      toast.success("Status removido!");
    } catch {
      toast.error("Erro ao remover status");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <Settings className="h-4 w-4" /> Gerenciar Status
          </CardTitle>
          <Button size="sm" variant="neutral" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", color: "#6B7280" }); }}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="flex items-end gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-1">
              <Label className="text-xs">Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Em andamento" />
            </div>
            <div>
              <Label className="text-xs">Cor</Label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim()}>
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </div>
        )}
        {statuses.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhum status criado. Clique em + para adicionar.</p>
        )}
        {statuses.map(s => (
          <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-sm font-medium">{s.name}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(s)}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(s)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
