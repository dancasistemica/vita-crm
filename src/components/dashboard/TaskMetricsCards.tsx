import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, Button } from '@/components/ui/ds';
import { Skeleton } from '@/components/ui/ds';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface TaskPreview {
  id: string;
  title: string;
  due_date: string;
}

const getRelativeTime = (dueDate: string): string => {
  const due = new Date(dueDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'amanhã';
  if (diffDays === -1) return 'ontem';
  if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
  return `em ${diffDays}d`;
};

export default function TaskMetricsCards() {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const [overdueCount, setOverdueCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState<TaskPreview[]>([]);
  const [pendingTasks, setPendingTasks] = useState<TaskPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTaskMetrics = useCallback(async () => {
    if (!organizationId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    console.log('[Dashboard] Carregando métricas de tarefas para org:', organizationId);

    const [overdueRes, pendingRes, overdueCountRes, pendingCountRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('organization_id', organizationId)
        .eq('completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', todayISO)
        .order('due_date', { ascending: true })
        .limit(5),
      supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('organization_id', organizationId)
        .eq('completed', false)
        .not('due_date', 'is', null)
        .gte('due_date', todayISO)
        .order('due_date', { ascending: true })
        .limit(5),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', todayISO),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('completed', false)
        .not('due_date', 'is', null)
        .gte('due_date', todayISO),
    ]);

    setOverdueTasks((overdueRes.data || []) as TaskPreview[]);
    setPendingTasks((pendingRes.data || []) as TaskPreview[]);
    setOverdueCount(overdueCountRes.count ?? 0);
    setPendingCount(pendingCountRes.count ?? 0);
    setLoading(false);

    console.log('[Dashboard] Tarefas vencidas carregadas:', overdueCountRes.count);
    console.log('[Dashboard] Tarefas pendentes carregadas:', pendingCountRes.count);
  }, [organizationId]);

  useEffect(() => {
    loadTaskMetrics();
  }, [loadTaskMetrics]);

  useEffect(() => {
    if (!organizationId) return;
    const channel = supabase
      .channel('tasks-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `organization_id=eq.${organizationId}` },
        () => {
          console.log('[Dashboard] Realtime: mudança detectada em tasks, recarregando métricas');
          loadTaskMetrics();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId, loadTaskMetrics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i} className="shadow-card border-border/60">
            <CardContent className="pt-5 pb-4"><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Overdue */}
      <Card className="shadow-card border-border/60 border-l-4 border-l-destructive">
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarefas Vencidas</p>
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            </div>
          </div>
          {overdueCount === 0 ? (
            <p className="text-sm text-muted-foreground">✅ Nenhuma tarefa vencida</p>
          ) : (
            <div className="space-y-1.5">
              {overdueTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate flex-1 mr-2">• {t.title}</span>
                  <span className="text-destructive text-xs font-medium whitespace-nowrap">{getRelativeTime(t.due_date)}</span>
                </div>
              ))}
            </div>
          )}
          {overdueCount > 0 && (
            < variant="ghost" size="sm" className="w-full min-h-[44px] text-destructive hover:text-destructive" onClick={() => navigate('/tarefas?filter=overdue')}>
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="shadow-card border-border/60 border-l-4 border-l-warning">
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarefas Pendentes</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </div>
          </div>
          {pendingCount === 0 ? (
            <p className="text-sm text-muted-foreground">✅ Nenhuma tarefa pendente</p>
          ) : (
            <div className="space-y-1.5">
              {pendingTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate flex-1 mr-2">• {t.title}</span>
                  <span className="text-warning text-xs font-medium whitespace-nowrap">{getRelativeTime(t.due_date)}</span>
                </div>
              ))}
            </div>
          )}
          {pendingCount > 0 && (
            < variant="ghost" size="sm" className="w-full min-h-[44px] text-warning hover:text-warning" onClick={() => navigate('/tarefas?filter=pending')}>
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
