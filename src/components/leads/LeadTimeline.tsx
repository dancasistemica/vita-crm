import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, ArrowRightLeft, MessageSquare, CheckSquare, ShoppingCart, Clock
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'creation' | 'stage_change' | 'interaction' | 'task_created' | 'task_completed' | 'sale';
  title: string;
  description?: string;
  meta?: Record<string, string>;
}

const EVENT_CONFIG: Record<TimelineEvent['type'], { icon: typeof Clock; color: string; label: string }> = {
  creation: { icon: UserPlus, color: 'bg-primary/20 text-primary', label: 'Criação' },
  stage_change: { icon: ArrowRightLeft, color: 'bg-warning/20 text-warning', label: 'Mudança de Etapa' },
  interaction: { icon: MessageSquare, color: 'bg-info/20 text-info', label: 'Interação' },
  task_created: { icon: CheckSquare, color: 'bg-muted text-muted-foreground', label: 'Tarefa Criada' },
  task_completed: { icon: CheckSquare, color: 'bg-success/20 text-success', label: 'Tarefa Concluída' },
  sale: { icon: ShoppingCart, color: 'bg-accent/20 text-accent', label: 'Venda' },
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays}d atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
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

  useEffect(() => {
    if (!organizationId || !leadId) return;

    const loadTimeline = async () => {
      setLoading(true);
      const allEvents: TimelineEvent[] = [];

      // 1. Lead creation event
      if (leadCreatedAt) {
        allEvents.push({
          id: 'creation',
          date: leadCreatedAt,
          type: 'creation',
          title: 'Lead criado no sistema',
        });
      }

      // Fetch all data in parallel
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

      // 2. Stage changes
      if (stageRes.status === 'fulfilled' && stageRes.value.data) {
        for (const h of stageRes.value.data) {
          allEvents.push({
            id: `stage-${h.id}`,
            date: h.changed_at,
            type: 'stage_change',
            title: `Movido de "${h.from_stage || '—'}" para "${h.to_stage}"`,
          });
        }
      }

      // 3. Interactions
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

      // 4. Tasks
      if (taskRes.status === 'fulfilled' && taskRes.value.data) {
        for (const t of taskRes.value.data) {
          allEvents.push({
            id: `task-${t.id}`,
            date: t.created_at,
            type: t.completed ? 'task_completed' : 'task_created',
            title: t.title,
            description: t.due_date ? `Vencimento: ${new Date(t.due_date).toLocaleDateString('pt-BR')}` : undefined,
          });
        }
      }

      // 5. Sales
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

      // Sort descending by date
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(allEvents);
      setLoading(false);
    };

    loadTimeline();
  }, [leadId, organizationId, leadCreatedAt]);

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
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
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum evento registrado para este lead.
      </p>
    );
  }

  return (
    <div className="relative space-y-0 py-2">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />

      {events.map((event, idx) => {
        const config = EVENT_CONFIG[event.type];
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Icon circle */}
            <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(event.date)}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1">{event.title}</p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
