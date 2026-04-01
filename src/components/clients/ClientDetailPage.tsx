import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDataAccess } from '@/hooks/useDataAccess';
import { ArrowLeft, Plus, ShoppingCart, MessageSquare, CheckSquare, StickyNote, Edit2, Clock, Trash2, Loader } from 'lucide-react';
import LeadTimeline from '@/components/leads/LeadTimeline';
import { INTERACTION_TYPES } from '@/types/crm';
import { toast } from 'sonner';
import EditSaleModal from '@/components/sales/EditSaleModal';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ScheduleMessageDialog } from '@/components/messages/ScheduleMessageDialog';
import { ScheduledMessagesList } from '@/components/messages/ScheduledMessagesList';
import { deleteSale } from '@/services/saleService';
import { Alert, Badge, Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from "@/components/ui/ds";

const statusBadgeVariants: Record<string, any> = {
  ativo: 'success',
  concluído: 'default',
  cancelado: 'neutral',
  pendência: 'warning',
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

  const fetchData = useCallback(async () => {
    if (!dataAccess || !id) return;
    try {
      const [salesRes, intRes, prodRes, tasksRes] = await Promise.allSettled([
        dataAccess.getSales(),
        dataAccess.getInteractions(),
        dataAccess.getProducts(),
        dataAccess.getTasks(),
      ]);

      if (salesRes.status === 'fulfilled') {
        setSales((salesRes.value as any[]).filter(s => s.lead_id === id).map(s => ({
          id: s.id, leadId: s.lead_id, productId: s.product_id || '',
          value: Number(s.value) || 0, date: s.sale_date || '',
          paymentMethod: s.payment_method || '', status: s.status || 'ativo',
          sale_type: s.sale_type || 'unica',
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
    } catch (error) {
      console.error('[ClientDetailPage] Error fetching data:', error);
    }
  }, [dataAccess, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClientSale = async (saleId: string, saleType: 'unica' | 'mensalidade') => {
    if (!confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('[ClientDetailPage] Deletando venda:', saleId);
      await deleteSale(saleId, saleType);
      console.log('[ClientDetailPage] ✅ Venda deletada com sucesso');
      toast.success('Venda deletada com sucesso!');
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar venda';
      console.error('[ClientDetailPage] ❌ Erro ao deletar venda:', errorMessage);
      toast.error(errorMessage);
    }
  };

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
        <p className="text-neutral-600 mb-4">Cliente não encontrado.</p>
        <Button variant="secondary" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const totalValue = sales.reduce((s, x) => s + x.value, 0);
  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || '—';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clientes')} icon={<ArrowLeft className="h-5 w-5" />} />
        
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
              {client.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">{client.name}</h1>
              <p className="text-sm text-neutral-600">{client.email} • {client.phone} • {client.city}</p>
              {client.dealValue != null && client.dealValue > 0 && (
                <p className="text-sm font-semibold text-success-600 mt-1">💰 Valor do Negócio: R$ {client.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card variant="primary" padding="md" className="text-center">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total em Vendas</p>
              <p className="text-2xl font-bold text-success-600">R$ {totalValue.toLocaleString('pt-BR')}</p>
            </Card>
            <Card variant="primary" padding="md" className="text-center">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Compras</p>
              <p className="text-2xl font-bold text-neutral-900">{sales.length}</p>
            </Card>
            <Card variant="primary" padding="md" className="text-center">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Interações</p>
              <p className="text-2xl font-bold text-neutral-900">{interactions.length}</p>
            </Card>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setScheduleDialogOpen(true)}
              icon={<Clock className="h-4 w-4" />}
              disabled={!client.phone}
            >
              Agendar Mensagem
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vendas" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="vendas" className="gap-1"><ShoppingCart className="h-4 w-4" /> Vendas</TabsTrigger>
            <TabsTrigger value="interacoes" className="gap-1"><MessageSquare className="h-4 w-4" /> Interações</TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-1"><CheckSquare className="h-4 w-4" /> Tarefas</TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-1"><Clock className="h-4 w-4" /> Agendamentos</TabsTrigger>
            <TabsTrigger value="notas" className="gap-1"><StickyNote className="h-4 w-4" /> Notas</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1"><Clock className="h-4 w-4" /> Histórico</TabsTrigger>
          </TabsList>
        </div>

        <Card variant="elevated" padding="lg">
          {/* Vendas */}
          <TabsContent value="vendas" className="space-y-4">
            {sales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600">Nenhuma venda registrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map(sale => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => setEditSaleId(sale.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{getProductName(sale.productId)}</p>
                        <p className="text-xs text-neutral-500">{sale.date} • {sale.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-success-600">R$ {sale.value.toLocaleString('pt-BR')}</span>
                      <Badge variant={statusBadgeVariants[sale.status] || 'neutral'}>{sale.status}</Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={<Edit2 className="h-4 w-4" />} onClick={e => { e.stopPropagation(); setEditSaleId(sale.id); }} />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-error-600" />}
                          onClick={(e) => { e.stopPropagation(); handleDeleteClientSale(sale.id, sale.sale_type); }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Interações */}
          <TabsContent value="interacoes" className="space-y-4">
            {interactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600">Nenhuma interação registrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map(int => {
                  const typeLabel = INTERACTION_TYPES.find(t => t.value === int.type)?.label || int.type;
                  return (
                    <div key={int.id} className="flex gap-4 p-4 rounded-lg border border-neutral-100 bg-neutral-50">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="secondary" size="sm">{typeLabel}</Badge>
                          <span className="text-xs text-neutral-500">{int.date}</span>
                        </div>
                        <p className="text-sm text-neutral-800">{int.note}</p>
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
              <div className="text-center py-12">
                <p className="text-neutral-600">Nenhuma tarefa vinculada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border border-neutral-100">
                    <div className="flex items-center gap-3">
                      <CheckSquare className={`h-5 w-5 ${task.completed ? 'text-success-600' : 'text-neutral-400'}`} />
                      <div>
                        <p className={`font-medium ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{task.title}</p>
                        <p className="text-xs text-neutral-500">Vencimento: {task.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant={task.completed ? 'success' : 'warning'}>{task.completed ? 'Feita' : 'Pendente'}</Badge>
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
              className="min-h-[200px] w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
        </Card>
      </Tabs>

      {editSaleId && (
        <EditSaleModal
          isOpen={!!editSaleId}
          onClose={() => setEditSaleId(null)}
          sale={sales.find(s => s.id === editSaleId) as any}
          onSuccess={fetchData}
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
