import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, Instagram, Edit, Trash2, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import LeadTimeline from '@/components/leads/LeadTimeline';
import type { LeadView } from '@/hooks/useLeadsData';
import { ScheduleMessageDialog } from '@/components/messages/ScheduleMessageDialog';
import { ScheduledMessagesList } from '@/components/messages/ScheduledMessagesList';

interface LeadDetailSheetProps {
  lead: LeadView | null;
  open: boolean;
  onClose: () => void;
  stageName?: string;
  interestLabel?: string;
  onEdit?: (lead: LeadView) => void;
  onDelete?: (leadId: string) => void;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  assigned_to: string | null;
}

interface InteractionRow {
  id: string;
  type: string;
  note: string | null;
  interaction_date: string | null;
  created_at: string;
}

export default function LeadDetailSheet({
  lead, open, onClose, stageName, interestLabel, onEdit, onDelete,
}: LeadDetailSheetProps) {
  const { organizationId } = useOrganization();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!lead || !organizationId) return;
    setLoadingTasks(true);
    const { data } = await supabase
      .from('tasks')
      .select('id, title, due_date, completed, assigned_to')
      .eq('lead_id', lead.id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    setTasks((data as TaskRow[]) || []);
    setLoadingTasks(false);
  }, [lead?.id, organizationId]);

  const loadInteractions = useCallback(async () => {
    if (!lead || !organizationId) return;
    setLoadingInteractions(true);
    const { data } = await supabase
      .from('interactions')
      .select('id, type, note, interaction_date, created_at')
      .eq('lead_id', lead.id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    setInteractions((data as InteractionRow[]) || []);
    setLoadingInteractions(false);
  }, [lead?.id, organizationId]);

  useEffect(() => {
    if (open && lead) {
      setActiveTab('info');
      loadTasks();
      loadInteractions();
    }
  }, [open, lead?.id]);

  // Reload on tab switch
  useEffect(() => {
    if (activeTab === 'tasks') loadTasks();
    if (activeTab === 'interactions') loadInteractions();
  }, [activeTab]);

  if (!lead) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR');

  const getTaskStatus = (t: TaskRow) => {
    if (t.completed) return { label: 'Concluída', color: 'text-success', icon: CheckCircle };
    if (t.due_date && new Date(t.due_date) < new Date()) return { label: 'Vencida', color: 'text-destructive', icon: AlertTriangle };
    return { label: 'Pendente', color: 'text-warning', icon: Clock };
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="p-6 pb-0">
          <SheetHeader>
            <SheetTitle className="text-lg font-display">{lead.name}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 flex-wrap">
              {stageName && <Badge variant="outline" className="text-xs">{stageName}</Badge>}
              {interestLabel && <Badge variant="secondary" className="text-xs">{interestLabel}</Badge>}
              {lead.origin && <span className="text-xs">{lead.origin}</span>}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="info" className="text-xs">Informações</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">
                Tarefas
                {tasks.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{tasks.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="interactions" className="text-xs">
                Interações
                {interactions.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{interactions.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs">Agendamentos</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
            </TabsList>
          </div>

          {/* INFO TAB */}
          <TabsContent value="info" className="px-6 pb-6 mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoField label="Email" value={lead.email} />
              <InfoField label="Telefone" value={lead.phone} />
              <InfoField label="Instagram" value={lead.instagram} />
              <InfoField label="Cidade" value={lead.city} />
              <InfoField label="CPF" value={lead.cpf} />
              <InfoField label="RG" value={lead.rg} />
              <InfoField label="Responsável" value={lead.responsible} />
              <InfoField label="Interesse Principal" value={lead.mainInterest} />
              <InfoField label="Data de Entrada" value={lead.entryDate ? formatDate(lead.entryDate) : ''} />
              <InfoField label="Valor do Negócio" value={lead.dealValue != null ? formatCurrency(lead.dealValue) : ''} />
            </div>

            {lead.tags.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
              </div>
            )}

            {lead.notes && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">Observações</span>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            {/* Custom data */}
            {lead.customData && Object.keys(lead.customData).length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">Campos Personalizados</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {Object.entries(lead.customData).map(([key, value]) => (
                    <InfoField key={key} label={key} value={String(value ?? '')} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
              {lead.phone && (
                <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" /> WhatsApp</Button>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScheduleDialogOpen(true)}
                className="gap-2 min-h-[44px]"
                disabled={!lead.phone}
              >
                <Clock className="h-4 w-4" />
                Agendar Mensagem
              </Button>
              {lead.email && (
                <a href={`mailto:${lead.email}`}>
                  <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Email</Button>
                </a>
              )}
              {lead.instagram && (
                <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><Instagram className="h-4 w-4 mr-1" /> Instagram</Button>
                </a>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(lead.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              )}
            </div>
          </TabsContent>

          {/* TASKS TAB */}
          <TabsContent value="tasks" className="px-6 pb-6 mt-4 space-y-3">
            {loadingTasks ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa vinculada a este lead.</p>
            ) : (
              tasks.map(t => {
                const status = getTaskStatus(t);
                const Icon = status.icon;
                return (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${status.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span className={status.color}>{status.label}</span>
                        {t.due_date && <span>Prazo: {formatDate(t.due_date)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* INTERACTIONS TAB */}
          <TabsContent value="interactions" className="px-6 pb-6 mt-4 space-y-3">
            {loadingInteractions ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma interação registrada para este lead.</p>
            ) : (
              interactions.map(i => (
                <div key={i.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{i.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {i.interaction_date ? formatDate(i.interaction_date) : formatDate(i.created_at)}
                    </span>
                  </div>
                  {i.note && <p className="text-sm text-foreground mt-1">{i.note}</p>}
                </div>
              ))
            )}
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="px-6 pb-6 mt-4">
            <LeadTimeline leadId={lead.id} leadCreatedAt={lead.entryDate || undefined} />
          </TabsContent>

          {/* SCHEDULED TAB */}
          <TabsContent value="scheduled" className="px-6 pb-6 mt-4">
            <ScheduledMessagesList organizationId={organizationId} leadId={lead.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
      <ScheduleMessageDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        lead={{ id: lead.id, name: lead.name, phone: lead.phone }}
        onScheduled={() => {
          console.log('[LeadDetailSheet] Mensagem agendada');
        }}
      />
    </Sheet>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <p className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
        {value || 'Não informado'}
      </p>
    </div>
  );
}
