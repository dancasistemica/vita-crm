import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCRMStore } from '@/store/crmStore';
import { Lead, Sale } from '@/types/crm';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  'Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Pix',
  'Transferência Bancária', 'Boleto', 'Outro',
];

interface NewSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedLeadId?: string;
}

export default function NewSaleModal({ open, onOpenChange, preSelectedLeadId }: NewSaleModalProps) {
  const store = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [productId, setProductId] = useState('');
  const [value, setValue] = useState('');
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [status, setStatus] = useState<Sale['status']>('ativo');
  const [observations, setObservations] = useState('');
  const [customPayment, setCustomPayment] = useState('');

  // Pre-select lead when modal opens
  useMemo(() => {
    if (open && preSelectedLeadId) {
      const lead = store.leads.find(l => l.id === preSelectedLeadId);
      if (lead) setSelectedLead(lead);
    }
    if (!open) {
      // Reset form
      setSearchQuery('');
      setSelectedLead(null);
      setShowResults(false);
      setProductId('');
      setValue('');
      setSaleDate(new Date());
      setPaymentMethod('Pix');
      setStatus('ativo');
      setObservations('');
      setCustomPayment('');
    }
  }, [open, preSelectedLeadId]);

  // Determine if a lead is a "client" (has sales)
  const isClient = (leadId: string) => store.sales.some(s => s.leadId === leadId);

  // Search leads
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return store.leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.includes(q)
    ).slice(0, 10);
  }, [searchQuery, store.leads]);

  const handleSelectLead = (lead: Lead) => {
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

  const handleSubmit = () => {
    if (!selectedLead) { toast.error('Selecione um lead ou cliente'); return; }
    if (!productId) { toast.error('Selecione um produto'); return; }
    if (!value || parseValue(value) <= 0) { toast.error('Informe um valor válido'); return; }

    setSaving(true);

    const clientStage = store.pipelineStages.find(s => s.name === 'Cliente');

    const sale: Sale = {
      id: crypto.randomUUID(),
      leadId: selectedLead.id,
      productId,
      value: parseValue(value),
      date: format(saleDate, 'yyyy-MM-dd'),
      paymentMethod: paymentMethod === 'Outro' ? customPayment || 'Outro' : paymentMethod,
      status,
    };

    store.addSale(sale);
    console.log('[NewSaleModal] Venda criada:', sale.id);

    // Move lead to "Cliente" stage if not already
    if (clientStage && selectedLead.pipelineStage !== clientStage.id) {
      store.moveLead(selectedLead.id, clientStage.id);
      console.log('[NewSaleModal] Lead movido para etapa Cliente');
    }

    toast.success('Venda registrada com sucesso!');
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Section 1: Lead/Client search */}
          <div className="space-y-2">
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
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedLead(null)}>
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
                      <button
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Sale data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Produto/Serviço *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {store.products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Data da Venda *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !saleDate && 'text-muted-foreground')}>
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
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
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
            <div className="space-y-2">
              <Label>Status da Venda *</Label>
              <Select value={status} onValueChange={v => setStatus(v as Sale['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {store.saleStatuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observations */}
            <div className="space-y-2 sm:col-span-2">
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Venda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
