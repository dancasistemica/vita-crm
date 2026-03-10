import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart } from "lucide-react";
import { Sale } from "@/types/crm";
import { toast } from "sonner";

const statusColors: Record<string, string> = { ativo: 'bg-success/20 text-success', concluído: 'bg-muted text-muted-foreground', cancelado: 'bg-destructive/20 text-destructive', pendência: 'bg-warning/20 text-warning' };

export default function ClientesPage() {
  const { leads, sales, products, addSale, updateSale, saleStatuses } = useCRMStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string>('');

  const clients = leads.filter(l => l.pipelineStage === '7');
  const getClientSales = (leadId: string) => sales.filter(s => s.leadId === leadId);
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || '—';

  const handleAddSale = (data: Partial<Sale>) => {
    const sale: Sale = {
      id: crypto.randomUUID(),
      leadId: data.leadId || selectedLead,
      productId: data.productId || '',
      value: data.value || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || '',
      status: (data.status as Sale['status']) || 'ativo',
    };
    addSale(sale);
    toast.success("Venda registrada!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Clientes</h1>
      </div>

      {clients.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum cliente ainda. Mova leads para a etapa "Cliente" no pipeline.</p>}

      {clients.map(client => {
        const clientSales = getClientSales(client.id);
        return (
          <Card key={client.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display">{client.name}</CardTitle>
                <Dialog open={dialogOpen && selectedLead === client.id} onOpenChange={o => { setDialogOpen(o); if (o) setSelectedLead(client.id); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Nova Venda</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-display">Registrar Venda</DialogTitle></DialogHeader>
                    <SaleForm products={products} saleStatuses={saleStatuses} onSave={handleAddSale} />
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-sm text-muted-foreground">{client.email} • {client.city}</p>
            </CardHeader>
            <CardContent>
              {clientSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
              ) : (
                <div className="space-y-2">
                  {clientSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{getProductName(sale.productId)}</p>
                          <p className="text-xs text-muted-foreground">{sale.date} • {sale.paymentMethod}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">R$ {sale.value.toLocaleString('pt-BR')}</span>
                        <Badge className={statusColors[sale.status] || ''}>{sale.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SaleForm({ products, saleStatuses, onSave }: { products: any[]; saleStatuses: string[]; onSave: (data: Partial<Sale>) => void }) {
  const [form, setForm] = useState<Partial<Sale>>({ date: new Date().toISOString().split('T')[0], status: 'ativo' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
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
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.productId}>Salvar</Button>
    </div>
  );
}
