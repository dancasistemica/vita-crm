import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Badge, Skeleton } from "@/components/ui/ds";
import {
  UserPlus, ArrowRight, MessageSquare, CheckSquare, CheckCircle, ShoppingCart, Clock
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'creation' | 'stage_change' | 'interaction' | 'task_created' | 'task_completed' | 'sale';
  title: string;
  description?: string;
}

const EVENT_CONFIG: Record<TimelineEvent['type'], { icon: typeof Clock; color: string; label: string }> = {
  creation: { icon: UserPlus, color: 'bg-success/20 text-success', label: 'Criação' },
  stage_change: { icon: ArrowRight, color: 'bg-accent/20 text-accent', label: 'Mudança de Etapa' },
  interaction: { icon: MessageSquare, color: 'bg-info/20 text-info', label: 'Interação' },
  task_created: { icon: CheckSquare, color: 'bg-warning/20 text-warning', label: 'Tarefa Criada' },
  task_completed: { icon: CheckCircle, color: 'bg-success/20 text-success', label: 'Tarefa Concluída' },
  sale: { icon: ShoppingCart, color: 'bg-primary/20 text-primary', label: 'Venda' },
};

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days === 1) return 'ontem';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (eventDay.getTime() === today.getTime()) return 'HOJE';
  if (eventDay.getTime() === yesterday.getTime()) return 'ONTEM';
  return date.toLocaleDateString('pt-BR');
}

interface LeadTimelineProps {
  leadId: string;
  leadCreatedAt?: string;
}

export default function LeadTimeline({ leadId, leadCreatedAt }: LeadTimelineProps) {
  const { organizationId } = useOrganization();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = useCallback(async () => {
    if (!organizationId || !leadId) return;
    setLoading(true);
    const allEvents: TimelineEvent[] = [];

    if (leadCreatedAt) {
      allEvents.push({
        id: 'creation',
        date: leadCreatedAt,
        type: 'creation',
        title: 'Lead criado no sistema',
      });
    }

    const [stageRes, intRes, taskRes, saleRes] = await Promise.allSettled([
      supabase
        .from('pipeline_stage_history')
        .select('id, from_stage, to_stage, changed_at')
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)
        .order('changed_at', { ascending: false }),
      supabase
        .from('interactions')
        .select('id, type, note, interaction_date, created_at')
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('id, title, completed, created_at, due_date')
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('sales')
        .select('id, value, sale_date, status, created_at')
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
    ]);

    if (stageRes.status === 'fulfilled' && stageRes.value.data) {
      for (const h of stageRes.value.data) {
        allEvents.push({
          id: `stage-${h.id}`,
          date: h.changed_at,
          type: 'stage_change',
          title: `${h.from_stage || '—'} → ${h.to_stage}`,
        });
      }
    }

    if (intRes.status === 'fulfilled' && intRes.value.data) {
      for (const i of intRes.value.data) {
        allEvents.push({
          id: `int-${i.id}`,
          date: i.created_at,
          type: 'interaction',
          title: i.type || 'Interação',
          description: i.note || undefined,
        });
      }
    }

    if (taskRes.status === 'fulfilled' && taskRes.value.data) {
      for (const t of taskRes.value.data) {
        allEvents.push({
          id: `task-${t.id}`,
          date: t.created_at,
          type: t.completed ? 'task_completed' : 'task_created',
          title: t.title,
          description: t.due_date ? `Prazo: ${new Date(t.due_date).toLocaleDateString('pt-BR')}` : undefined,
        });
      }
    }

    if (saleRes.status === 'fulfilled' && saleRes.value.data) {
      for (const s of saleRes.value.data) {
        allEvents.push({
          id: `sale-${s.id}`,
          date: s.created_at,
          type: 'sale',
          title: `Venda R$ ${Number(s.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          description: s.status !== 'ativo' ? `Status: ${s.status}` : undefined,
        });
      }
    }

    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log('[LeadTimeline] Total de eventos carregados:', allEvents.length);
    setEvents(allEvents);
    setLoading(false);
  }, [leadId, organizationId, leadCreatedAt]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Realtime subscription
  useEffect(() => {
    if (!leadId || !organizationId) return;

    const channel = supabase
      .channel(`timeline-${leadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions', filter: `lead_id=eq.${leadId}` }, () => {
        console.log('[LeadTimeline] Realtime: novo evento detectado, recarregando');
        loadTimeline();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `lead_id=eq.${leadId}` }, () => {
        loadTimeline();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_stage_history', filter: `lead_id=eq.${leadId}` }, () => {
        loadTimeline();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `lead_id=eq.${leadId}` }, () => {
        loadTimeline();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [leadId, organizationId, loadTimeline]);

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-8">
        Nenhum evento registrado para este lead.
      </p>
    );
  }

  // Group events by date
  const grouped: { label: string; events: TimelineEvent[] }[] = [];
  let currentGroup = '';
  for (const event of events) {
    const group = getDateGroup(event.date);
    if (group !== currentGroup) {
      currentGroup = group;
      grouped.push({ label: group, events: [event] });
    } else {
      grouped[grouped.length - 1].events.push(event);
    }
  }

  return (
    <div className="relative py-2">
      <div className="absolute left-[15px] top-6 bottom-4 w-px bg-border" />

      {grouped.map((group, gi) => (
        <div key={gi}>
          {/* Date group header */}
          <div className="relative z-10 flex items-center gap-3 mb-3 mt-4 first:mt-0">
            <span className="text-xs font-bold text-neutral-500 bg-background pr-2 uppercase tracking-wider">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {group.events.map((event) => {
            const config = EVENT_CONFIG[event.type];
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative flex gap-3 pb-5 last:pb-2">
                <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {config.label}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {getRelativeTime(event.date)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-neutral-500 mt-0.5">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
