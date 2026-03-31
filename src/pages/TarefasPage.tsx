import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LeadSelectWithSearch from "@/components/tasks/LeadSelectWithSearch";
import TaskActionButtons from "@/components/tasks/TaskActionButtons";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskStatusManager from "@/components/tasks/TaskStatusManager";
import NotificationCenter from "@/components/tasks/NotificationCenter";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, AlertCircle, Clock, CheckCircle2, UserCircle, Settings, Calendar } from "lucide-react";
import { formatDateToBR } from "@/utils/dateFormatter";
import { TASK_TYPES } from "@/types/crm";
import { toast } from "sonner";
import AIFollowUpGenerator from "@/components/ai/AIFollowUpGenerator";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TaskRow {
  id: string;
  title: string;
  lead_id: string | null;
  due_date: string | null;
  completed: boolean;
  type: string | null;
  assigned_to: string | null;
  status_id: string | null;
  organization_id: string;
  created_at: string;
  leads?: { name: string } | null;
}

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order_index: number;
  organization_id: string;
}

interface TaskNotification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface OrgMember {
  user_id: string;
  role: string;
  profiles?: { full_name: string; email: string | null } | null;
}

export default function TarefasPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dataAccess = useDataAccess();
  const { user } = useAuth();
  const { leads, pipelineStages } = useLeadsData();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const dashboardFilter = searchParams.get('filter'); // 'overdue' | 'pending' | null

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

  const fetchOrgMembers = useCallback(async () => {
    if (!dataAccess) return;
    try {
      const data = await dataAccess.getOrgMembers();
      setOrgMembers((data as unknown as OrgMember[]) || []);
    } catch (err) {
      console.error('[TarefasPage] Erro ao carregar membros:', err);
    }
  }, [dataAccess]);

  const fetchTaskStatuses = useCallback(async () => {
    if (!dataAccess) return;
    try {
      const data = await dataAccess.getTaskStatuses();
      setTaskStatuses((data || []) as TaskStatus[]);
    } catch (err) {
      console.error('[TarefasPage] Erro ao carregar status:', err);
    }
  }, [dataAccess]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !dataAccess) return;
    try {
      const { data, error } = await supabase
        .from('task_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setNotifications((data || []) as TaskNotification[]);
    } catch (err) {
      console.error('[TarefasPage] Erro ao carregar notificações:', err);
    }
  }, [user?.id, dataAccess]);

  useEffect(() => {
    fetchTasks();
    fetchOrgMembers();
    fetchTaskStatuses();
    fetchNotifications();
  }, [fetchTasks, fetchOrgMembers, fetchTaskStatuses, fetchNotifications]);

  useEffect(() => {
    const state = location.state as { taskId?: string } | null;
    if (!state?.taskId) return;

    const targetTask = tasks.find(task => task.id === state.taskId);
    if (targetTask) {
      setEditingTask(targetTask);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, tasks, navigate, location.pathname]);

  // Client-side filtering
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      // Dashboard pre-filter
      if (dashboardFilter === 'overdue') {
        if (t.completed || !t.due_date || t.due_date >= todayStr) return false;
      } else if (dashboardFilter === 'pending') {
        if (t.completed || !t.due_date || t.due_date < todayStr) return false;
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const leadName = leads.find(l => l.id === t.lead_id)?.name?.toLowerCase() || '';
        if (!t.title.toLowerCase().includes(search) && !leadName.includes(search)) return false;
      }
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (assignedFilter === 'unassigned' && t.assigned_to) return false;
      if (assignedFilter !== 'all' && assignedFilter !== 'unassigned' && t.assigned_to !== assignedFilter) return false;
      if (dateFrom && t.due_date && t.due_date < dateFrom) return false;
      if (dateTo && t.due_date && t.due_date > dateTo) return false;
      return true;
    });
  }, [tasks, searchTerm, typeFilter, assignedFilter, dateFrom, dateTo, leads, dashboardFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setAssignedFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const today = new Date().toISOString().split('T')[0];
  const overdue = filteredTasks.filter(t => !t.completed && t.due_date && t.due_date < today);
  const todayTasks = filteredTasks.filter(t => !t.completed && t.due_date === today);
  const upcoming = filteredTasks.filter(t => !t.completed && (!t.due_date || t.due_date > today));
  const completed = filteredTasks.filter(t => t.completed);

  const getLeadName = (id: string | null) => {
    if (!id) return '—';
    return leads.find(l => l.id === id)?.name || '—';
  };
  const getTypeLabel = (type: string | null) => TASK_TYPES.find(t => t.value === type)?.label || type || 'Outro';
  const getMemberName = (userId: string | null) => {
    if (!userId) return null;
    const m = orgMembers.find(m => m.user_id === userId);
    return m?.profiles?.full_name || m?.profiles?.email || null;
  };
  const getStatusById = (statusId: string | null) => {
    if (!statusId) return null;
    return taskStatuses.find(s => s.id === statusId) || null;
  };

  const handleAdd = async (data: { title: string; leadId: string; dueDate: string; type: string; assignedTo: string; statusId: string }) => {
    if (!dataAccess) return;
    try {
      await dataAccess.createTask({
        title: data.title,
        lead_id: data.leadId || null,
        due_date: data.dueDate || null,
        type: data.type || 'outro',
        assigned_to: data.assignedTo || null,
        status_id: data.statusId || null,
      });
      toast.success("Tarefa criada!");
      setDialogOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      console.error('[TarefasPage] Erro ao criar tarefa:', err);
      toast.error("Erro ao criar tarefa");
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setDialogOpen(true);
    }
  };

  const handleSaveEdit = async (data: { title: string; leadId: string; dueDate: string; type: string; assignedTo: string; statusId: string }) => {
    if (!dataAccess || !editingTask) return;
    try {
      await dataAccess.updateTask(editingTask.id, {
        title: data.title,
        lead_id: data.leadId || null,
        due_date: data.dueDate || null,
        type: data.type || 'outro',
        assigned_to: data.assignedTo || null,
        status_id: data.statusId || null,
      });
      toast.success("Tarefa atualizada!");
      setDialogOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      console.error('[TarefasPage] Erro ao atualizar tarefa:', err);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDuplicate = async (taskId: string) => {
    if (!dataAccess) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      await dataAccess.createTask({
        title: `${task.title} (Cópia)`,
        lead_id: task.lead_id,
        due_date: task.due_date,
        type: task.type,
        assigned_to: task.assigned_to,
        status_id: task.status_id,
      });
      toast.success("Tarefa duplicada!");
      await fetchTasks();
    } catch (err) {
      console.error('[TarefasPage] Erro ao duplicar tarefa:', err);
      toast.error("Erro ao duplicar tarefa");
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

  const handleAssign = async (taskId: string, userId: string | null) => {
    if (!dataAccess) return;
    try {
      await dataAccess.updateTask(taskId, { assigned_to: userId });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: userId } : t));
      toast.success(userId ? "Tarefa designada!" : "Designação removida");

      // Create notification if assigning to someone
      if (userId && user?.id && userId !== user.id) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await supabase.from('task_notifications').insert({
            organization_id: task.organization_id,
            task_id: taskId,
            user_id: userId,
            type: 'assigned',
            message: `Você foi designado(a) para a tarefa "${task.title}"`,
          } as any);
        }
      }
    } catch (err) {
      console.error('[TarefasPage] Erro ao designar tarefa:', err);
      toast.error("Erro ao designar tarefa");
    }
  };

  const handleStatusChange = async (taskId: string, statusId: string | null) => {
    if (!dataAccess) return;
    try {
      await dataAccess.updateTask(taskId, { status_id: statusId });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status_id: statusId } : t));

      const task = tasks.find(t => t.id === taskId);
      const newStatus = taskStatuses.find(s => s.id === statusId);
      if (task?.assigned_to && user?.id && task.assigned_to !== user.id && newStatus) {
        await supabase.from('task_notifications').insert({
          organization_id: task.organization_id,
          task_id: taskId,
          user_id: task.assigned_to,
          type: 'status_changed',
          message: `Tarefa "${task.title}" foi movida para "${newStatus.name}"`,
        } as any);
      }
    } catch (err) {
      console.error('[TarefasPage] Erro ao alterar status:', err);
      toast.error("Erro ao alterar status");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  // Status management handlers
  const handleCreateStatus = async (data: { name: string; color: string; order_index: number }) => {
    if (!dataAccess) return;
    try {
      await dataAccess.createTaskStatus(data);
      await fetchTaskStatuses();
    } catch (err) {
      console.error('[TarefasPage] Erro ao criar status:', err);
      toast.error("Erro ao criar status");
    }
  };

  const handleUpdateStatus = async (id: string, data: { name: string; color: string }) => {
    if (!dataAccess) return;
    try {
      await dataAccess.updateTaskStatus(id, data);
      await fetchTaskStatuses();
    } catch (err) {
      console.error('[TarefasPage] Erro ao atualizar status:', err);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!dataAccess) return;
    try {
      await dataAccess.deleteTaskStatus(id);
      await fetchTaskStatuses();
    } catch (err) {
      console.error('[TarefasPage] Erro ao deletar status:', err);
      toast.error("Erro ao deletar status");
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await supabase.from('task_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await supabase.from('task_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatCreatedDate = (dateStr: string) => formatDateToBR(dateStr);

  const TaskItem = ({ task }: { task: TaskRow }) => {
    const assignedName = getMemberName(task.assigned_to);
    const status = getStatusById(task.status_id);

    return (
      <Card className={task.completed ? 'opacity-50' : ''}>
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <Checkbox checked={task.completed} onCheckedChange={() => handleToggle(task)} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{getLeadName(task.lead_id)}</span>
              <Badge variant="outline" className="text-xs">{getTypeLabel(task.type)}</Badge>
              {task.due_date && <span className="text-xs text-muted-foreground">{formatDateToBR(task.due_date)}</span>}
              {assignedName && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <UserCircle className="h-3 w-3" />
                  {assignedName}
                </Badge>
              )}
              {status && (
                <Badge className="text-xs text-white" style={{ backgroundColor: status.color }}>
                  {status.name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatCreatedDate(task.created_at)}
              </span>
            </div>
          </div>

          {/* Status selector */}
          {taskStatuses.length > 0 && (
            <Select value={task.status_id || 'none'} onValueChange={v => handleStatusChange(task.id, v === 'none' ? null : v)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem status</SelectItem>
                {taskStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <AssignPopover taskId={task.id} assignedTo={task.assigned_to} orgMembers={orgMembers} onAssign={handleAssign} />
          <TaskActionButtons
            taskId={task.id}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-neutral-900 mb-6">Tarefas</h1>
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Tarefas</h1>
        <div className="flex items-center gap-3">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllRead}
          />
          <Button variant="outline" size="sm" onClick={() => setShowStatusManager(!showStatusManager)}>
            <Settings className="h-4 w-4 mr-1" /> Status
          </Button>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova Tarefa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
              <TaskForm
                leads={leads}
                pipelineStages={pipelineStages}
                orgMembers={orgMembers}
                taskStatuses={taskStatuses}
                onSave={editingTask ? handleSaveEdit : handleAdd}
                initialData={editingTask}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showStatusManager && (
        <TaskStatusManager
          statuses={taskStatuses}
          onCreateStatus={handleCreateStatus}
          onUpdateStatus={handleUpdateStatus}
          onDeleteStatus={handleDeleteStatus}
        />
      )}

      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        assignedFilter={assignedFilter}
        onAssignedChange={setAssignedFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClear={clearFilters}
        orgMembers={orgMembers}
      />

      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-2"><AlertCircle className="h-4 w-4 text-destructive" /><h2 className="text-2xl font-semibold text-neutral-900">Atrasadas ({overdue.length})</h2></div>
          <div className="space-y-3">{overdue.map(t => <TaskItem key={t.id} task={t} />)}</div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-3 mb-2"><Clock className="h-4 w-4 text-primary" /><h2 className="text-2xl font-semibold text-neutral-900">Hoje ({todayTasks.length})</h2></div>
        <div className="space-y-3">
          {todayTasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje.</p> : todayTasks.map(t => <TaskItem key={t.id} task={t} />)}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-2"><Clock className="h-4 w-4 text-muted-foreground" /><h2 className="text-2xl font-semibold text-neutral-900">Próximos ({upcoming.length})</h2></div>
          <div className="space-y-3">{upcoming.map(t => <TaskItem key={t.id} task={t} />)}</div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-2"><CheckCircle2 className="h-4 w-4 text-success" /><h2 className="text-2xl font-semibold text-neutral-900">Concluídas ({completed.length})</h2></div>
          <div className="space-y-3">{completed.map(t => <TaskItem key={t.id} task={t} />)}</div>
        </section>
      )}
    </div>
  );
}

// ── Assign Popover ──
function AssignPopover({ taskId, assignedTo, orgMembers, onAssign }: {
  taskId: string;
  assignedTo: string | null;
  orgMembers: OrgMember[];
  onAssign: (taskId: string, userId: string | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Designar responsável">
          <UserCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <button
          onClick={() => onAssign(taskId, null)}
          className={`w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition ${!assignedTo ? 'bg-muted font-medium' : ''}`}
        >
          Sem responsável
        </button>
        {orgMembers.map(m => (
          <button
            key={m.user_id}
            onClick={() => onAssign(taskId, m.user_id)}
            className={`w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition ${assignedTo === m.user_id ? 'bg-muted font-medium' : ''}`}
          >
            {m.profiles?.full_name || m.profiles?.email || m.user_id.slice(0, 8)}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ── Task Form ──
function TaskForm({ leads, pipelineStages, orgMembers, taskStatuses, onSave, initialData }: {
  leads: any[];
  pipelineStages: any[];
  orgMembers: OrgMember[];
  taskStatuses: TaskStatus[];
  onSave: (data: { title: string; leadId: string; dueDate: string; type: string; assignedTo: string; statusId: string }) => void;
  initialData?: TaskRow | null;
}) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    leadId: initialData?.lead_id || '',
    dueDate: initialData?.due_date || new Date().toISOString().split('T')[0],
    type: initialData?.type || 'follow_up',
    assignedTo: initialData?.assigned_to || '',
    statusId: initialData?.status_id || '',
  });
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Responsável</Label>
          <Select value={form.assignedTo || 'none'} onValueChange={v => set('assignedTo', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {orgMembers.map(m => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name || m.profiles?.email || m.user_id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {taskStatuses.length > 0 && (
          <div>
            <Label>Status</Label>
            <Select value={form.statusId || 'none'} onValueChange={v => set('statusId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem status</SelectItem>
                {taskStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {form.type === 'follow_up' && selectedLead && (
        <AIFollowUpGenerator lead={selectedLead} stageName={stageName} />
      )}

      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.title.trim()}>
        {initialData ? 'Salvar Alterações' : 'Salvar'}
      </Button>
    </div>
  );
}
