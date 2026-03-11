import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMStore } from '@/store/crmStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, ShoppingCart, MessageSquare, CheckSquare, StickyNote, ExternalLink, Edit2 } from 'lucide-react';
import { Sale, INTERACTION_TYPES } from '@/types/crm';
import { toast } from 'sonner';
import EditSaleModal from '@/components/sales/EditSaleModal';

const statusColors: Record<string, string> = {
  ativo: 'bg-success/20 text-success',
  concluído: 'bg-info/20 text-info',
  cancelado: 'bg-muted text-muted-foreground',
  pendência: 'bg-warning/20 text-warning',
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, sales, products, interactions, tasks, saleStatuses, addSale, addInteraction, updateLead } = useCRMStore();
  const [editSaleId, setEditSaleId] = useState<string | null>(null);

  const client = leads.find(l => l.id === id);
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

  const clientSales = sales.filter(s => s.leadId === id);
  const clientInteractions = interactions.filter(i => i.leadId === id).sort((a, b) => b.date.localeCompare(a.date));
  const clientTasks = tasks.filter(t => t.leadId === id);
  const totalValue = clientSales.reduce((s, x) => s + x.value, 0);
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
                <p className="text-lg font-semibold text-foreground">{clientSales.length}</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Interações</p>
                <p className="text-lg font-semibold text-foreground">{clientInteractions.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vendas">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="vendas" className="gap-1"><ShoppingCart className="h-4 w-4" /> Vendas</TabsTrigger>
          <TabsTrigger value="interacoes" className="gap-1"><MessageSquare className="h-4 w-4" /> Interações</TabsTrigger>
          <TabsTrigger value="tarefas" className="gap-1"><CheckSquare className="h-4 w-4" /> Tarefas</TabsTrigger>
          <TabsTrigger value="notas" className="gap-1"><StickyNote className="h-4 w-4" /> Notas</TabsTrigger>
        </TabsList>

        {/* Vendas */}
        <TabsContent value="vendas" className="space-y-4">
          <div className="flex justify-end">
            <NewSaleDialog clientId={client.id} products={products} saleStatuses={saleStatuses} addSale={addSale} />
          </div>
          {clientSales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-2">
              {clientSales.map(sale => (
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
          {clientInteractions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma interação registrada.</p>
          ) : (
            <div className="space-y-3">
              {clientInteractions.map(int => {
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
          {clientTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa vinculada.</p>
          ) : (
            <div className="space-y-2">
              {clientTasks.map(task => (
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
            value={client.notes}
            onChange={e => updateLead(client.id, { notes: e.target.value })}
            className="min-h-[200px]"
          />
        </TabsContent>
      </Tabs>

      <EditSaleModal
        open={!!editSaleId}
        onOpenChange={(o) => { if (!o) setEditSaleId(null); }}
        saleId={editSaleId}
      />
    </div>
  );
}

function NewSaleDialog({ clientId, products, saleStatuses, addSale }: { clientId: string; products: any[]; saleStatuses: string[]; addSale: (sale: Sale) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Sale>>({ date: new Date().toISOString().split('T')[0], status: 'ativo' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const sale: Sale = {
      id: crypto.randomUUID(),
      leadId: clientId,
      productId: form.productId || '',
      value: form.value || 0,
      date: form.date || new Date().toISOString().split('T')[0],
      paymentMethod: form.paymentMethod || '',
      status: (form.status as Sale['status']) || 'ativo',
    };
    addSale(sale);
    toast.success('Venda registrada!');
    setOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0], status: 'ativo' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Registrar Venda</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Produto</Label>
            <Select value={form.productId || ''} onValueChange={v => set('productId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$)</Label><Input type="number" value={form.value || ''} onChange={e => set('value', Number(e.target.value))} /></div>
            <div><Label>Data</Label><Input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Pagamento</Label><Input value={form.paymentMethod || ''} onChange={e => set('paymentMethod', e.target.value)} placeholder="Cartão, Pix..." /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || 'ativo'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{saleStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={!form.productId}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
