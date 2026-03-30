import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDataAccess } from '@/hooks/useDataAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, ShoppingCart, MessageSquare, CheckSquare, StickyNote, Edit2, Clock } from 'lucide-react';
import LeadTimeline from '@/components/leads/LeadTimeline';
import { INTERACTION_TYPES } from '@/types/crm';
import { toast } from 'sonner';
import EditSaleModal from '@/components/sales/EditSaleModal';
import { useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ScheduleMessageDialog } from '@/components/messages/ScheduleMessageDialog';
import { ScheduledMessagesList } from '@/components/messages/ScheduledMessagesList';

const statusColors: Record<string, string> = {
  ativo: 'bg-success/20 text-success',
  concluído: 'bg-info/20 text-info',
  cancelado: 'bg-muted text-muted-foreground',
  pendência: 'bg-warning/20 text-warning',
};

interface SaleView {
  id: string;
  leadId: string;
  productId: string;
  value: number;
  date: string;
  paymentMethod: string;
  status: string;
  sale_type: 'unica' | 'mensalidade';
  created_at: string;
  updated_at: string;
}

interface InteractionView {
  id: string;
  leadId: string;
  date: string;
  type: string;
  note: string;
}

interface TaskView {
  id: string;
  leadId: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface ProductView {
  id: string;
  name: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, updateLead } = useLeadsData();
  const dataAccess = useDataAccess();
  const { organizationId } = useOrganization();

  const [sales, setSales] = useState<SaleView[]>([]);
  const [interactions, setInteractions] = useState<InteractionView[]>([]);
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const client = leads.find(l => l.id === id);

  // Fetch related data from DB
  useEffect(() => {
    if (!dataAccess || !id) return;
    Promise.allSettled([
      dataAccess.getSales(),
      dataAccess.getInteractions(),
      dataAccess.getProducts(),
      dataAccess.getTasks(),
    ]).then(([salesRes, intRes, prodRes, tasksRes]) => {
      if (salesRes.status === 'fulfilled') {
        setSales((salesRes.value as any[]).filter(s => s.lead_id === id).map(s => ({
          id: s.id, leadId: s.lead_id, productId: s.product_id || '',
          value: Number(s.value) || 0, date: s.sale_date || '',
          paymentMethod: s.payment_method || '', status: s.status || 'ativo',
          sale_type: 'unica',
          created_at: s.created_at,
          updated_at: s.updated_at,
        })));
      }
      if (intRes.status === 'fulfilled') {
        setInteractions((intRes.value as any[]).filter(i => i.lead_id === id)
          .map(i => ({ id: i.id, leadId: i.lead_id, date: i.interaction_date || '', type: i.type, note: i.note || '' }))
          .sort((a, b) => b.date.localeCompare(a.date)));
      }
      if (prodRes.status === 'fulfilled') {
        setProducts((prodRes.value as any[]).map(p => ({ id: p.id, name: p.name })));
      }
      if (tasksRes.status === 'fulfilled') {
        setTasks((tasksRes.value as any[]).filter(t => t.lead_id === id).map(t => ({
          id: t.id, leadId: t.lead_id || '', title: t.title,
          dueDate: t.due_date || '', completed: t.completed || false,
        })));
      }
    });
  }, [dataAccess, id]);

  // Sync notes from client
  useEffect(() => {
    if (client) setNotesValue(client.notes || '');
  }, [client?.id]);

  const handleNotesBlur = useCallback(async () => {
    if (!client || notesValue === (client.notes || '')) return;
    console.log('[ClientDetailPage] Salvando notas:', { id: client.id });
    await updateLead(client.id, { notes: notesValue });
    toast.success('Notas salvas!');
  }, [client, notesValue, updateLead]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const totalValue = sales.reduce((s, x) => s + x.value, 0);
  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')} className="mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-semibold text-primary">
              {client.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-display text-foreground">{client.name}</h1>
              <p className="text-sm text-muted-foreground">{client.email} • {client.phone} • {client.city}</p>
              {client.instagram && <p className="text-sm text-muted-foreground">{client.instagram}</p>}
              {client.dealValue != null && client.dealValue > 0 && (
                <p className="text-sm font-medium text-success mt-1">💰 Valor do Negócio: R$ {client.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <Card className="flex-1">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total em Vendas</p>
                <p className="text-lg font-semibold text-success">R$ {totalValue.toLocaleString('pt-BR')}</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Compras</p>
                <p className="text-lg font-semibold text-foreground">{sales.length}</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Interações</p>
                <p className="text-lg font-semibold text-foreground">{interactions.length}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleDialogOpen(true)}
              className="gap-2 min-h-[44px]"
              disabled={!client.phone}
            >
              <Clock className="h-4 w-4" />
              Agendar Mensagem
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
        <Tabs defaultValue="vendas">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="vendas" className="gap-1"><ShoppingCart className="h-4 w-4" /> Vendas</TabsTrigger>
            <TabsTrigger value="interacoes" className="gap-1"><MessageSquare className="h-4 w-4" /> Interações</TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-1"><CheckSquare className="h-4 w-4" /> Tarefas</TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-1"><Clock className="h-4 w-4" /> Agendamentos</TabsTrigger>
            <TabsTrigger value="notas" className="gap-1"><StickyNote className="h-4 w-4" /> Notas</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1"><Clock className="h-4 w-4" /> Histórico</TabsTrigger>
          </TabsList>

        {/* Vendas */}
        <TabsContent value="vendas" className="space-y-4">
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-2">
              {sales.map(sale => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setEditSaleId(sale.id)}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{getProductName(sale.productId)}</p>
                      <p className="text-xs text-muted-foreground">{sale.date} • {sale.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-success">R$ {sale.value.toLocaleString('pt-BR')}</span>
                    <Badge className={statusColors[sale.status] || ''}>{sale.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditSaleId(sale.id); }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Interações */}
        <TabsContent value="interacoes" className="space-y-4">
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma interação registrada.</p>
          ) : (
            <div className="space-y-3">
              {interactions.map(int => {
                const typeLabel = INTERACTION_TYPES.find(t => t.value === int.type)?.label || int.type;
                return (
                  <div key={int.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                    <div className="h-8 w-8 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                        <span className="text-xs text-muted-foreground">{int.date}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{int.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tarefas */}
        <TabsContent value="tarefas" className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa vinculada.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <CheckSquare className={`h-4 w-4 ${task.completed ? 'text-success' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                      <p className="text-xs text-muted-foreground">Vencimento: {task.dueDate}</p>
                    </div>
                  </div>
                  <Badge variant={task.completed ? 'secondary' : 'outline'}>{task.completed ? 'Feita' : 'Pendente'}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notas */}
        <TabsContent value="notas" className="space-y-4">
          <Textarea
            placeholder="Notas internas sobre este cliente..."
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            onBlur={handleNotesBlur}
            className="min-h-[200px]"
          />
        </TabsContent>

        {/* Agendamentos */}
        <TabsContent value="agendamentos" className="space-y-4">
          <ScheduledMessagesList organizationId={organizationId} clientId={client.id} />
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <LeadTimeline leadId={id!} leadCreatedAt={undefined} />
        </TabsContent>
      </Tabs>

      {editSaleId && (
        <EditSaleModal
          isOpen={!!editSaleId}
          onClose={() => setEditSaleId(null)}
          sale={sales.find(s => s.id === editSaleId) as any}
        />
      )}
      <ScheduleMessageDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        client={{ id: client.id, name: client.name, phone: client.phone }}
        onScheduled={() => {
          console.log('[ClientDetail] Mensagem agendada com sucesso');
        }}
      />
    </div>
  );
}
