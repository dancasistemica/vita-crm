import { useState, useMemo, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Input } from '@/components/ui/ds';
import { Label } from '@/components/ui/ds';
import { Textarea } from '@/components/ui/ds';
import { Badge } from '@/components/ui/ds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/ds';
import { Calendar } from '@/components/ui/ds';
import { CalendarIcon, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useDataAccess } from '@/hooks/useDataAccess';
import { useLeadsData, LeadView } from '@/hooks/useLeadsData';

const SALE_STATUSES = ['ativo', 'concluído', 'cancelado', 'pendência'];

interface SalesStageView {
  id: string;
  name: string;
  value: number;
}

interface ProductView {
  id: string;
  name: string;
  stages: SalesStageView[];
}

interface NewSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedLeadId?: string;
  onSaleCreated?: () => void;
}

export default function NewSaleModal({ open, onOpenChange, preSelectedLeadId, onSaleCreated }: NewSaleModalProps) {
  const dataAccess = useDataAccess();
  const { leads, pipelineStages, updateLead, refetch: refetchLeads } = useLeadsData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadView | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [sales, setSales] = useState<{ lead_id: string }[]>([]);
  const [selectedStageId, setSelectedStageId] = useState('');

  // Form state
  const [productId, setProductId] = useState('');
  const [value, setValue] = useState('');
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [status, setStatus] = useState<string>('ativo');
  const [observations, setObservations] = useState('');
  const [customPayment, setCustomPayment] = useState('');

  // Fetch products, payment methods, and sales from DB
  useEffect(() => {
    if (!dataAccess || !open) return;
    console.log('[NewSaleModal] 🔄 Carregando dados (dataAccess disponível)');
    const load = async () => {
      try {
        const [prods, methods, salesData] = await Promise.allSettled([
          dataAccess.getProducts(),
          dataAccess.getPaymentMethods(),
          dataAccess.getSales(),
        ]);
        
        console.log('[NewSaleModal] Products result:', prods.status, prods.status === 'fulfilled' ? (prods.value as any[])?.length : (prods as any).reason);
        
        if (prods.status === 'fulfilled') {
          const mapped = (prods.value as any[]).map(p => ({
            id: p.id,
            name: p.name,
            stages: (p.product_sales_stages || []).map((s: any) => ({
              id: s.id, name: s.name, value: Number(s.value) || 0,
            })),
          }));
          console.log('[NewSaleModal] ✅ Produtos mapeados:', mapped.length, mapped);
          setProducts(mapped);
        } else {
          console.error('[NewSaleModal] ❌ Erro ao carregar produtos:', (prods as any).reason);
        }
        
        if (methods.status === 'fulfilled') {
          const names = (methods.value as any[]).map(m => m.name);
          setPaymentMethods(names.length > 0 ? [...names, 'Outro'] : ['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Pix', 'Transferência Bancária', 'Boleto', 'Outro']);
        }
        if (salesData.status === 'fulfilled') {
          setSales((salesData.value as any[]).map(s => ({ lead_id: s.lead_id })));
        }
      } catch (err) {
        console.error('[NewSaleModal] Erro ao carregar dados:', err);
      }
    };
    load();
  }, [dataAccess, open]);

  // Pre-select lead / reset form
  useEffect(() => {
    if (open && preSelectedLeadId) {
      const lead = leads.find(l => l.id === preSelectedLeadId);
      if (lead) setSelectedLead(lead);
    }
    if (!open) {
      setSearchQuery('');
      setSelectedLead(null);
      setShowResults(false);
      setProductId('');
      setSelectedStageId('');
      setValue('');
      setSaleDate(new Date());
      setPaymentMethod('Pix');
      setStatus('ativo');
      setObservations('');
      setCustomPayment('');
    }
  }, [open, preSelectedLeadId, leads]);

  const isClient = useCallback((leadId: string) => sales.some(s => s.lead_id === leadId), [sales]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.includes(q)
    ).slice(0, 10);
  }, [searchQuery, leads]);

  const handleSelectLead = (lead: LeadView) => {
    setSelectedLead(lead);
    setSearchQuery('');
    setShowResults(false);
    console.log('[NewSaleModal] Lead selecionado:', lead.name);
  };

  const formatCurrency = (val: string) => {
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    const cents = parseInt(num) / 100;
    return cents.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setValue(formatCurrency(raw));
  };

  const parseValue = (formatted: string): number => {
    if (!formatted) return 0;
    return parseFloat(formatted.replace(/\./g, '').replace(',', '.'));
  };

  const handleSubmit = async () => {
    if (!selectedLead) { toast.error('Selecione um lead ou cliente'); return; }
    if (!productId) { toast.error('Selecione um produto'); return; }
    if (!value || parseValue(value) <= 0) { toast.error('Informe um valor válido'); return; }
    if (!dataAccess) { toast.error('Erro de conexão'); return; }

    setSaving(true);
    console.log('[NewSaleModal] Iniciando criação de venda:', { leadId: selectedLead.id });

    try {
      // 1. Create sale in database
      const saleData: Record<string, unknown> = {
        lead_id: selectedLead.id,
        product_id: productId,
        value: parseValue(value),
        sale_date: format(saleDate, 'yyyy-MM-dd'),
        payment_method: paymentMethod === 'Outro' ? customPayment || 'Outro' : paymentMethod,
        status,
        notes: observations || '',
      };

      const result = await dataAccess.createSale(saleData);
      console.log('[NewSaleModal] ✅ Venda criada no banco:', result?.id);

      // 2. Move lead to "Cliente" stage if not already
      const clienteStage = pipelineStages.find(s => s.name === 'Cliente');
      if (clienteStage && selectedLead.pipelineStage !== clienteStage.id) {
        await updateLead(selectedLead.id, { pipelineStage: clienteStage.id });
        console.log('[NewSaleModal] ✅ Lead movido para etapa Cliente:', { leadId: selectedLead.id, stageId: clienteStage.id });
      }

      toast.success('Venda registrada com sucesso!');
      await refetchLeads();
      onSaleCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('[NewSaleModal] ❌ Erro ao criar venda:', error);
      toast.error('Erro ao registrar venda. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Section 1: Lead/Client search */}
          <div className="space-y-3">
            <Label>Selecione o Lead ou Cliente *</Label>
            {selectedLead ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedLead.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedLead.email}</p>
                  </div>
                  <Badge variant={isClient(selectedLead.id) ? 'default' : 'secondary'} className="text-[10px]">
                    {isClient(selectedLead.id) ? 'Cliente' : 'Lead'}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => setSelectedLead(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Digite nome, email ou telefone..."
                  className="pl-9"
                />
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(lead => (
                      <Button variant="secondary" size="sm"
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email} • {lead.phone}</p>
                        </div>
                        <Badge variant={isClient(lead.id) ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {isClient(lead.id) ? 'Cliente' : 'Lead'}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Sale data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-3 sm:col-span-2">
              <Label>Produto/Serviço *</Label>
              <Select value={productId} onValueChange={(pid) => {
                setProductId(pid);
                setSelectedStageId('');
                // Don't auto-fill value here, let stage selection do it
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sales Stage (if product has stages) */}
            {productId && (products.find(p => p.id === productId)?.stages?.length ?? 0) > 0 && (
              <div className="space-y-3 sm:col-span-2">
                <Label>Fase / Lote</Label>
                <Select value={selectedStageId} onValueChange={(stageId) => {
                  setSelectedStageId(stageId);
                  const product = products.find(p => p.id === productId);
                  const stage = product?.stages.find(s => s.id === stageId);
                  if (stage && stage.value > 0) {
                    const formatted = stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    setValue(formatted);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma fase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.find(p => p.id === productId)?.stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — R$ {s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Value */}
            <div className="space-y-3">
              <Label>Valor (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  value={value}
                  onChange={handleValueChange}
                  placeholder="0,00"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-3">
              <Label>Data da Venda *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" className={cn('w-full justify-start text-left font-normal', !saleDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {saleDate ? format(saleDate, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={saleDate}
                    onSelect={d => d && setSaleDate(d)}
                    disabled={date => date > new Date()}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment method */}
            <div className="space-y-3">
              <Label>Forma de Pagamento *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {paymentMethod === 'Outro' && (
                <Input
                  value={customPayment}
                  onChange={e => setCustomPayment(e.target.value)}
                  placeholder="Especifique..."
                  className="mt-2"
                />
              )}
            </div>

            {/* Status */}
            <div className="space-y-3">
              <Label>Status da Venda *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALE_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observations */}
            <div className="space-y-3 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Adicione observações sobre a venda..."
                maxLength={1000}
                rows={3}
              />
            </div>
          </div>

          {/* Section 3: Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            < variant="neutral" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </>
            < onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Venda'}
            </>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
