import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LeadSelectWithSearch from "@/components/tasks/LeadSelectWithSearch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Task as TaskType, TASK_TYPES } from "@/types/crm";
import { toast } from "sonner";

export default function TarefasPage() {
  const { leads, tasks, addTask, toggleTask, deleteTask } = useCRMStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => !t.completed && t.dueDate < today);
  const todayTasks = tasks.filter(t => !t.completed && t.dueDate === today);
  const upcoming = tasks.filter(t => !t.completed && t.dueDate > today);
  const completed = tasks.filter(t => t.completed);

  const getLeadName = (id: string) => leads.find(l => l.id === id)?.name || '—';
  const getTypeLabel = (type: string) => TASK_TYPES.find(t => t.value === type)?.label || type;

  const handleAdd = (data: Partial<TaskType>) => {
    const task: TaskType = {
      id: crypto.randomUUID(),
      leadId: data.leadId || '',
      title: data.title || '',
      dueDate: data.dueDate || today,
      completed: false,
      type: (data.type as TaskType['type']) || 'outro',
    };
    addTask(task);
    toast.success("Tarefa criada!");
    setDialogOpen(false);
  };

  const TaskItem = ({ task }: { task: TaskType }) => (
    <Card className={task.completed ? 'opacity-50' : ''}>
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{getLeadName(task.leadId)}</span>
            <Badge variant="outline" className="text-xs">{getTypeLabel(task.type)}</Badge>
            <span className="text-xs text-muted-foreground">{task.dueDate}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => { deleteTask(task.id); toast.success("Tarefa removida"); }}>Remover</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Tarefas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova Tarefa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Nova Tarefa</DialogTitle></DialogHeader>
            <TaskForm leads={leads} onSave={handleAdd} />
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

function TaskForm({ leads, onSave }: { leads: any[]; onSave: (data: Partial<TaskType>) => void }) {
  const [form, setForm] = useState<Partial<TaskType>>({ dueDate: new Date().toISOString().split('T')[0], type: 'follow_up' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <div><Label>Título</Label><Input value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
      <div>
        <Label>Lead</Label>
        <LeadSelectWithSearch
          value={form.leadId || ''}
          onChange={v => set('leadId', v)}
          leads={leads}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.type || 'outro'} onValueChange={v => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Data</Label><Input type="date" value={form.dueDate || ''} onChange={e => set('dueDate', e.target.value)} /></div>
      </div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.title?.trim()}>Salvar</Button>
    </div>
  );
}
