import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LeadSelectWithSearch from "@/components/tasks/LeadSelectWithSearch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { TASK_TYPES } from "@/types/crm";
import { toast } from "sonner";
import AIFollowUpGenerator from "@/components/ai/AIFollowUpGenerator";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useLeadsData } from "@/hooks/useLeadsData";

interface TaskRow {
  id: string;
  title: string;
  lead_id: string | null;
  due_date: string | null;
  completed: boolean;
  type: string | null;
  organization_id: string;
  created_at: string;
  leads?: { name: string } | null;
}

export default function TarefasPage() {
  const dataAccess = useDataAccess();
  const { leads, pipelineStages } = useLeadsData();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!dataAccess) return;
    setLoading(true);
    try {
      const data = await dataAccess.getTasks();
      setTasks(data as TaskRow[]);
    } catch (err) {
      console.error('[TarefasPage] Erro ao carregar tarefas:', err);
    } finally {
      setLoading(false);
    }
  }, [dataAccess]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => !t.completed && t.due_date && t.due_date < today);
  const todayTasks = tasks.filter(t => !t.completed && t.due_date === today);
  const upcoming = tasks.filter(t => !t.completed && (!t.due_date || t.due_date > today));
  const completed = tasks.filter(t => t.completed);

  const getLeadName = (id: string | null) => {
    if (!id) return '—';
    return leads.find(l => l.id === id)?.name || '—';
  };
  const getTypeLabel = (type: string | null) => TASK_TYPES.find(t => t.value === type)?.label || type || 'Outro';

  const handleAdd = async (data: { title: string; leadId: string; dueDate: string; type: string }) => {
    if (!dataAccess) return;
    try {
      await dataAccess.createTask({
        title: data.title,
        lead_id: data.leadId || null,
        due_date: data.dueDate || null,
        type: data.type || 'outro',
      });
      toast.success("Tarefa criada!");
      setDialogOpen(false);
      await fetchTasks();
    } catch (err) {
      console.error('[TarefasPage] Erro ao criar tarefa:', err);
      toast.error("Erro ao criar tarefa");
    }
  };

  const handleToggle = async (task: TaskRow) => {
    if (!dataAccess) return;
    try {
      await dataAccess.updateTask(task.id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    } catch (err) {
      console.error('[TarefasPage] Erro ao atualizar tarefa:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!dataAccess) return;
    try {
      await dataAccess.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Tarefa removida");
    } catch (err) {
      console.error('[TarefasPage] Erro ao deletar tarefa:', err);
      toast.error("Erro ao remover tarefa");
    }
  };

  const TaskItem = ({ task }: { task: TaskRow }) => (
    <Card className={task.completed ? 'opacity-50' : ''}>
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <Checkbox checked={task.completed} onCheckedChange={() => handleToggle(task)} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{getLeadName(task.lead_id)}</span>
            <Badge variant="outline" className="text-xs">{getTypeLabel(task.type)}</Badge>
            {task.due_date && <span className="text-xs text-muted-foreground">{task.due_date}</span>}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleDelete(task.id)}>Remover</Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display text-foreground">Tarefas</h1>
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Tarefas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova Tarefa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Nova Tarefa</DialogTitle></DialogHeader>
            <TaskForm leads={leads} pipelineStages={pipelineStages} onSave={handleAdd} />
          </DialogContent>
        </Dialog>
      </div>

      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-destructive" /><h2 className="font-semibold text-destructive">Atrasadas ({overdue.length})</h2></div>
          <div className="space-y-2">{overdue.map(t => <TaskItem key={t.id} task={t} />)}</div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-primary" /><h2 className="font-semibold">Hoje ({todayTasks.length})</h2></div>
        <div className="space-y-2">
          {todayTasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje.</p> : todayTasks.map(t => <TaskItem key={t.id} task={t} />)}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-muted-foreground" /><h2 className="font-semibold text-muted-foreground">Próximos ({upcoming.length})</h2></div>
          <div className="space-y-2">{upcoming.map(t => <TaskItem key={t.id} task={t} />)}</div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-success" /><h2 className="font-semibold text-success">Concluídas ({completed.length})</h2></div>
          <div className="space-y-2">{completed.map(t => <TaskItem key={t.id} task={t} />)}</div>
        </section>
      )}
    </div>
  );
}

function TaskForm({ leads, pipelineStages, onSave }: { leads: any[]; pipelineStages: any[]; onSave: (data: { title: string; leadId: string; dueDate: string; type: string }) => void }) {
  const [form, setForm] = useState({ title: '', leadId: '', dueDate: new Date().toISOString().split('T')[0], type: 'follow_up' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedLead = leads.find((l: any) => l.id === form.leadId);
  const stageName = pipelineStages.find((s: any) => s.id === selectedLead?.pipelineStage)?.name || '';

  return (
    <div className="space-y-3">
      <div><Label>Título</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
      <div>
        <Label>Lead</Label>
        <LeadSelectWithSearch value={form.leadId} onChange={v => set('leadId', v)} leads={leads} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={v => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Data</Label><Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
      </div>

      {form.type === 'follow_up' && selectedLead && (
        <AIFollowUpGenerator lead={selectedLead} stageName={stageName} />
      )}

      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.title.trim()}>Salvar</Button>
    </div>
  );
}
