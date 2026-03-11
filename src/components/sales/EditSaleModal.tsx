import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCRMStore } from '@/store/crmStore';
import { Sale } from '@/types/crm';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  'Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Pix',
  'Transferência Bancária', 'Boleto', 'Outro',
];

interface EditSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
}

export default function EditSaleModal({ open, onOpenChange, saleId }: EditSaleModalProps) {
  const store = useCRMStore();
  const [saving, setSaving] = useState(false);

  const sale = useMemo(() => store.sales.find(s => s.id === saleId) || null, [saleId, store.sales]);
  const lead = useMemo(() => sale ? store.leads.find(l => l.id === sale.leadId) : null, [sale, store.leads]);

  const [productId, setProductId] = useState('');
  const [value, setValue] = useState('');
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState<Sale['status']>('ativo');
  const [customPayment, setCustomPayment] = useState('');

  // Load sale data when modal opens
  useEffect(() => {
    if (open && sale) {
      setProductId(sale.productId);
      const formatted = sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setValue(formatted);
      setSaleDate(parseISO(sale.date));
      const isStandard = PAYMENT_METHODS.includes(sale.paymentMethod);
      setPaymentMethod(isStandard ? sale.paymentMethod : 'Outro');
      setCustomPayment(isStandard ? '' : sale.paymentMethod);
      setStatus(sale.status);
      console.log('[EditSaleModal] Dados carregados:', sale.id);
    }
  }, [open, sale]);

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

  const hasChanges = useMemo(() => {
    if (!sale) return false;
    const currentPayment = paymentMethod === 'Outro' ? customPayment || 'Outro' : paymentMethod;
    return (
      productId !== sale.productId ||
      parseValue(value) !== sale.value ||
      format(saleDate, 'yyyy-MM-dd') !== sale.date ||
      currentPayment !== sale.paymentMethod ||
      status !== sale.status
    );
  }, [sale, productId, value, saleDate, paymentMethod, customPayment, status]);

  const handleSubmit = () => {
    if (!sale) return;
    if (!productId) { toast.error('Selecione um produto'); return; }
    if (!value || parseValue(value) <= 0) { toast.error('Informe um valor válido'); return; }

    setSaving(true);
    const finalPayment = paymentMethod === 'Outro' ? customPayment || 'Outro' : paymentMethod;

    store.updateSale(sale.id, {
      productId,
      value: parseValue(value),
      date: format(saleDate, 'yyyy-MM-dd'),
      paymentMethod: finalPayment,
      status,
    });

    console.log('[EditSaleModal] Venda atualizada:', sale.id);
    toast.success('Venda atualizada com sucesso!');
    setSaving(false);
    onOpenChange(false);
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Client (readonly) */}
          {lead && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">{lead.name}</p>
                <p className="text-xs text-muted-foreground">{lead.email} • {lead.phone}</p>
              </div>
            </div>
          )}

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
                <Input value={value} onChange={handleValueChange} placeholder="0,00" className="pl-10" />
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
                <Input value={customPayment} onChange={e => setCustomPayment(e.target.value)} placeholder="Especifique..." className="mt-2" />
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
          </div>

          {/* Change indicator */}
          {hasChanges && (
            <div className="rounded-lg border border-info/30 bg-info/10 p-3">
              <p className="text-xs text-info">ℹ️ Você tem alterações não salvas</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !hasChanges}>
              {saving ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Sem Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
