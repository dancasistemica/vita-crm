import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import LeadSelectWithSearch from "@/components/tasks/LeadSelectWithSearch";
import { TaskActions } from "@/components/tasks/TaskActions";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskStatusManager from "@/components/tasks/TaskStatusManager";
import NotificationCenter from "@/components/tasks/NotificationCenter";
import { Plus, AlertCircle, Clock, CheckCircle2, UserCircle, Settings, Calendar as CalendarIcon } from "lucide-react";
import { formatDateToBR } from "@/utils/dateFormatter";
import { TASK_TYPES } from "@/types/crm";
import { toast } from "sonner";
import AIFollowUpGenerator from "@/components/ai/AIFollowUpGenerator";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, Badge, Button, Calendar, Card, Checkbox, Dialog, Input, Label, Popover, Select, Skeleton } from "@/components/ui/ds";

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

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const dashboardFilter = searchParams.get('filter');

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

  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
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

  const getLeadName = (id: string | null) => id ? (leads.find(l => l.id === id)?.name || '—') : '—';
  const getTypeLabel = (type: string | null) => TASK_TYPES.find(t => t.value === type)?.label || type || 'Outro';
  const getMemberName = (userId: string | null) => {
    if (!userId) return null;
    const m = orgMembers.find(m => m.user_id === userId);
    return m?.profiles?.full_name || m?.profiles?.email || null;
  };
  const getStatusById = (statusId: string | null) => statusId ? (taskStatuses.find(s => s.id === statusId) || null) : null;

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

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('task_notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('[TarefasPage] Erro ao marcar como lida:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('task_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('[TarefasPage] Erro ao marcar todas como lidas:', err);
    }
  };

  const handleCreateStatus = async (data: any) => {
    if (!dataAccess) return;
    try {
      await dataAccess.createTaskStatus(data);
      fetchTaskStatuses();
      toast.success("Status criado!");
    } catch (err) {
      console.error('[TarefasPage] Erro ao criar status:', err);
      toast.error("Erro ao criar status");
    }
  };

  const handleUpdateStatus = async (id: string, data: any) => {
    if (!dataAccess) return;
    try {
      await dataAccess.updateTaskStatus(id, data);
      fetchTaskStatuses();
      toast.success("Status atualizado!");
    } catch (err) {
      console.error('[TarefasPage] Erro ao atualizar status:', err);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!dataAccess) return;
    try {
      await dataAccess.deleteTaskStatus(id);
      fetchTaskStatuses();
      toast.success("Status removido!");
    } catch (err) {
      console.error('[TarefasPage] Erro ao deletar status:', err);
      toast.error("Erro ao remover status");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  const renderTask = (task: TaskRow) => {
    const assignedName = getMemberName(task.assigned_to);
    const status = getStatusById(task.status_id);

    return (
      <Card key={task.id} className={`${task.completed ? 'opacity-50' : ''}`} variant="primary" padding="md">
        <div className="flex items-center gap-3">
          <Checkbox checked={task.completed} onCheckedChange={() => handleToggle(task)} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">{getLeadName(task.lead_id)}</Badge>
              <Badge variant="secondary" className="text-xs">{getTypeLabel(task.type)}</Badge>
              {task.due_date && <span className="text-xs text-neutral-500">{formatDateToBR(task.due_date)}</span>}
              {assignedName && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <UserCircle className="h-3 w-3" />
                  {assignedName}
                </Badge>
              )}
              {status && (
                <Badge className="text-xs text-white" style={{ backgroundColor: status.color }}>
                  {status.name}
                </Badge>
              )}
            </div>
          </div>

          {taskStatuses.length > 0 && (
            <div className="w-32">
              <Select 
                value={task.status_id || ''} 
                onChange={e => handleStatusChange(task.id, e.target.value === '' ? null : e.target.value)}
                placeholder="Status"
                className="h-8 text-xs"
              >
                <option value="">Sem status</option>
                {taskStatuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          )}

          <AssignPopover taskId={task.id} assignedTo={task.assigned_to} orgMembers={orgMembers} onAssign={handleAssign} />
          <TaskActions
            taskId={task.id}
            onEdit={handleEdit}
            onComplete={() => handleToggle(task)}
            onDelete={handleDelete}
          />
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-4xl font-bold text-neutral-900">Tarefas</h1>
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-neutral-900">Tarefas</h1>
        <div className="flex items-center gap-3">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllRead}
          />
          <Button variant="secondary" size="md" onClick={() => setShowStatusManager(!showStatusManager)}>
            <Settings className="h-4 w-4 mr-1" /> Status
          </Button>
          <Button variant="primary" size="md" onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
          </Button>
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
          <div className="flex items-center gap-3 mb-2"><AlertCircle className="h-4 w-4 text-error-600" /><h2 className="text-2xl font-semibold text-neutral-900">Atrasadas ({overdue.length})</h2></div>
          <div className="space-y-3">{overdue.map(t => renderTask(t))}</div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-3 mb-2"><Clock className="h-4 w-4 text-primary-600" /><h2 className="text-2xl font-semibold text-neutral-900">Hoje ({todayTasks.length})</h2></div>
        <div className="space-y-3">
          {todayTasks.length === 0 ? <p className="text-sm text-neutral-500">Nenhuma tarefa para hoje.</p> : todayTasks.map(t => renderTask(t))}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-2"><Clock className="h-4 w-4 text-neutral-500" /><h2 className="text-2xl font-semibold text-neutral-900">Próximos ({upcoming.length})</h2></div>
          <div className="space-y-3">{upcoming.map(t => renderTask(t))}</div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-2"><CheckCircle2 className="h-4 w-4 text-success-600" /><h2 className="text-2xl font-semibold text-neutral-900">Concluídas ({completed.length})</h2></div>
          <div className="space-y-3">{completed.map(t => renderTask(t))}</div>
        </section>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <Button variant="ghost" onClick={() => handleDialogChange(false)}>✕</Button>
            </div>
            <TaskForm
              leads={leads}
              pipelineStages={pipelineStages}
              orgMembers={orgMembers}
              taskStatuses={taskStatuses}
              onSave={editingTask ? handleSaveEdit : handleAdd}
              initialData={editingTask}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

function AssignPopover({ taskId, assignedTo, orgMembers, onAssign }: {
  taskId: string;
  assignedTo: string | null;
  orgMembers: OrgMember[];
  onAssign: (taskId: string, userId: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0" 
        title="Designar responsável"
        onClick={() => setIsOpen(!isOpen)}
      >
        <UserCircle className="h-4 w-4" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 p-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
          <Button variant="secondary" size="sm"
            onClick={() => { onAssign(taskId, null); setIsOpen(false); }}
            className={`w-full text-left text-sm px-3 py-2 rounded hover:bg-neutral-100 transition ${!assignedTo ? 'bg-neutral-100 font-medium' : ''}`}
          >
            Sem responsável
          </Button>
          {orgMembers.map(m => (
            <Button variant="secondary" size="sm"
              key={m.user_id}
              onClick={() => { onAssign(taskId, m.user_id); setIsOpen(false); }}
              className={`w-full text-left text-sm px-3 py-2 rounded hover:bg-neutral-100 transition ${assignedTo === m.user_id ? 'bg-neutral-100 font-medium' : ''}`}
            >
              {m.profiles?.full_name || m.profiles?.email || m.user_id.slice(0, 8)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

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
          <Select value={form.type} onChange={e => set('type', e.target.value)} options={TASK_TYPES.map(t => ({ value: t.value, label: t.label }))} />
        </div>
        <div><Label>Data</Label><Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Responsável</Label>
          <Select value={form.assignedTo || 'none'} onChange={e => set('assignedTo', e.target.value === 'none' ? '' : e.target.value)}>
            <option value="none">Sem responsável</option>
            {orgMembers.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.full_name || m.profiles?.email || m.user_id.slice(0, 8)}
              </option>
            ))}
          </Select>
        </div>
        {taskStatuses.length > 0 && (
          <div>
            <Label>Status</Label>
            <Select value={form.statusId || 'none'} onChange={e => set('statusId', e.target.value === 'none' ? '' : e.target.value)}>
              <option value="none">Sem status</option>
              {taskStatuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
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
