import { useState } from "react";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { useCustomFields } from "@/hooks/useCustomFields";
import { Button } from "@/components/ui/ds/Button";
import { Input } from "@/components/ui/ds/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/ds/Badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { formatCPF, formatRG, validateCPF } from "@/services/cpfValidator";

interface LeadFormProps {
  lead: LeadView | null;
  onSave: (data: Partial<LeadView>) => void;
}

export default function LeadForm({ lead, onSave }: LeadFormProps) {
  const { origins, pipelineStages, tags, interestLevels } = useLeadsData();
  const { customFields } = useCustomFields();

  const defaultStageId = pipelineStages.length > 0
    ? pipelineStages.sort((a, b) => a.order - b.order)[0].id
    : '';

  const [form, setForm] = useState<Partial<LeadView>>(
    lead || { interestLevel: interestLevels[0]?.value || 'frio', pipelineStage: defaultStageId, tags: [], entryDate: new Date().toISOString().split('T')[0], responsible: '' }
  );

  const [cpfWarning, setCpfWarning] = useState(false);
  const [customData, setCustomData] = useState<Record<string, any>>(
    (lead as any)?.customData || (lead as any)?.custom_data || {}
  );

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const setCustom = (key: string, val: any) => setCustomData(d => ({ ...d, [key]: val }));

  const toggleTag = (tagName: string) => {
    const current = form.tags || [];
    if (current.includes(tagName)) {
      set('tags', current.filter(t => t !== tagName));
    } else {
      set('tags', [...current, tagName]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nome *</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
        <div><Label>Telefone / WhatsApp</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="5511999999999" /></div>
        <div><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
        <div><Label>Instagram</Label><Input value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="@usuario" /></div>
        <div><Label>Cidade</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
        <div><Label>Data de entrada</Label><Input type="date" value={form.entryDate || ''} onChange={e => set('entryDate', e.target.value)} /></div>
        <div>
          <Label>RG</Label>
          <Input value={form.rg || ''} onChange={e => set('rg', formatRG(e.target.value))} placeholder="00.000.000-0" maxLength={12} />
        </div>
        <div>
          <Label>CPF</Label>
          <Input
            value={form.cpf || ''}
            onChange={e => set('cpf', formatCPF(e.target.value))}
            onBlur={() => {
              const raw = (form.cpf || '').replace(/\D/g, '');
              if (raw.length === 11 && !validateCPF(form.cpf || '')) {
                setCpfWarning(true);
              } else {
                setCpfWarning(false);
              }
            }}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {cpfWarning && <p className="text-xs text-amber-500 mt-1">⚠️ CPF inválido</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Origem</Label>
          <Select value={form.origin || ''} onValueChange={v => set('origin', v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nível de interesse</Label>
          <Select value={form.interestLevel || 'frio'} onValueChange={v => set('interestLevel', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {interestLevels.map(l => <SelectItem key={l.id} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Etapa do funil</Label>
          <Select value={form.pipelineStage || '1'} onValueChange={v => set('pipelineStage', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{pipelineStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Responsável</Label>
          <Input value={form.responsible || ''} onChange={e => set('responsible', e.target.value)} placeholder="Nome do responsável" />
        </div>
      </div>
      <div><Label>Interesse principal</Label><Input value={form.mainInterest || ''} onChange={e => set('mainInterest', e.target.value)} /></div>
      <div>
        <Label>Valor do Negócio</Label>
        <Input
          inputMode="decimal"
          placeholder="R$ 0,00"
          value={form.dealValue != null ? `R$ ${Number(form.dealValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
          onChange={e => {
            const raw = e.target.value.replace(/[R$\s.]/g, '').replace(',', '.');
            const num = parseFloat(raw);
            set('dealValue', isNaN(num) ? null : num);
          }}
        />
      </div>
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map(t => (
            <Badge
              key={t.id}
              variant={(form.tags || []).includes(t.name) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(t.name)}
            >
              {t.name}
              {(form.tags || []).includes(t.name) && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
      </div>
      <div><Label>Observações</Label><Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div className="space-y-3 border-t pt-3">
          <p className="text-sm font-medium text-muted-foreground">Campos Customizados</p>
          <div className="grid grid-cols-2 gap-3">
            {customFields.map(cf => (
              <div key={cf.id}>
                <Label>{cf.field_label}{cf.is_required ? ' *' : ''}</Label>
                {cf.field_type === 'text' && (
                  <Input value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} />
                )}
                {cf.field_type === 'number' && (
                  <Input type="number" value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} />
                )}
                {cf.field_type === 'date' && (
                  <Input type="date" value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} />
                )}
                {cf.field_type === 'textarea' && (
                  <Textarea value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} className="min-h-[60px]" />
                )}
                {cf.field_type === 'select' && (
                  <Select value={customData[cf.field_name] || ''} onValueChange={v => setCustom(cf.field_name, v)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {(cf.field_options || []).map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {cf.field_type === 'checkbox' && (
                  <div className="flex items-center gap-3 mt-1">
                    <Checkbox
                      checked={!!customData[cf.field_name]}
                      onCheckedChange={v => setCustom(cf.field_name, v)}
                    />
                    <span className="text-sm">{cf.field_label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button className="w-full" onClick={() => onSave({ ...form, custom_data: customData } as any)} disabled={!form.name?.trim()}>Salvar</Button>
    </div>
  );
}
