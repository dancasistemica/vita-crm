import { useState } from "react";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { useCustomFields } from "@/hooks/useCustomFields";
import { 
  Button, 
  Input, 
  Select, 
  Badge, 
  Textarea, 
  Checkbox, 
  Label 
} from "@/components/ui/ds";
import { X } from "lucide-react";
import { formatCPF, formatRG, validateCPF } from "@/services/cpfValidator";
import { Button } from "@/components/ui/ds";

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
        <Input label="Nome *" value={form.name || ''} onChange={e => set('name', e.target.value)} />
        <Input label="Telefone / WhatsApp" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="5511999999999" />
        <Input label="Email" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
        <Input label="Instagram" value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="@usuario" />
        <Input label="Cidade" value={form.city || ''} onChange={e => set('city', e.target.value)} />
        <Input label="Data de entrada" type="date" value={form.entryDate || ''} onChange={e => set('entryDate', e.target.value)} />
        <Input 
          label="RG"
          value={form.rg || ''} 
          onChange={e => set('rg', formatRG(e.target.value))} 
          placeholder="00.000.000-0" 
          maxLength={12} 
        />
        <div>
          <Input
            label="CPF"
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
          {cpfWarning && <p className="text-xs text-error-600 mt-1">⚠️ CPF inválido</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select 
          label="Origem"
          value={form.origin || ''} 
          onChange={e => set('origin', e.target.value)}
          placeholder="Selecionar"
          options={origins.map(o => ({ value: o, label: o }))}
        />
        <Select 
          label="Nível de interesse"
          value={form.interestLevel || 'frio'} 
          onChange={e => set('interestLevel', e.target.value)}
          options={interestLevels.map(l => ({ value: l.value, label: l.label }))}
        />
        <Select 
          label="Etapa do funil"
          value={form.pipelineStage || '1'} 
          onChange={e => set('pipelineStage', e.target.value)}
          options={pipelineStages.map(s => ({ value: s.id, label: s.name }))}
        />
        <Input label="Responsável" value={form.responsible || ''} onChange={e => set('responsible', e.target.value)} placeholder="Nome do responsável" />
      </div>
      <Input label="Interesse principal" value={form.mainInterest || ''} onChange={e => set('mainInterest', e.target.value)} />
      <Input
        label="Valor do Negócio"
        inputMode="decimal"
        placeholder="R$ 0,00"
        value={form.dealValue != null ? `R$ ${Number(form.dealValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
        onChange={e => {
          const raw = e.target.value.replace(/[R$\s.]/g, '').replace(',', '.');
          const num = parseFloat(raw);
          set('dealValue', isNaN(num) ? null : num);
        }}
      />
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map(t => (
            <Badge
              key={t.id}
              variant={(form.tags || []).includes(t.name) ? "default" : "neutral"}
              className="cursor-pointer"
              onClick={() => toggleTag(t.name)}
            >
              {t.name}
              {(form.tags || []).includes(t.name) && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
      </div>
      <Textarea label="Observações" value={form.notes || ''} onChange={e => set('notes', e.target.value)} />

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div className="space-y-3 border-t pt-3 border-neutral-100">
          <p className="text-sm font-medium text-neutral-500">Campos Customizados</p>
          <div className="grid grid-cols-2 gap-3">
            {customFields.map(cf => (
              <div key={cf.id}>
                {cf.field_type === 'text' && (
                  <Input label={`${cf.field_label}${cf.is_required ? ' *' : ''}`} value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} />
                )}
                {cf.field_type === 'number' && (
                  <Input label={`${cf.field_label}${cf.is_required ? ' *' : ''}`} type="number" value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} />
                )}
                {cf.field_type === 'date' && (
                  <Input label={`${cf.field_label}${cf.is_required ? ' *' : ''}`} type="date" value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} />
                )}
                {cf.field_type === 'textarea' && (
                  <Textarea label={`${cf.field_label}${cf.is_required ? ' *' : ''}`} value={customData[cf.field_name] || ''} onChange={e => setCustom(cf.field_name, e.target.value)} className="min-h-[60px]" />
                )}
                {cf.field_type === 'select' && (
                  <Select 
                    label={`${cf.field_label}${cf.is_required ? ' *' : ''}`}
                    value={customData[cf.field_name] || ''} 
                    onChange={e => setCustom(cf.field_name, e.target.value)}
                    placeholder="Selecionar"
                    options={(cf.field_options || []).map(opt => ({ value: opt, label: opt }))}
                  />
                )}
                {cf.field_type === 'checkbox' && (
                  <div className="mt-1">
                    <Checkbox
                      label={cf.field_label}
                      checked={!!customData[cf.field_name]}
                      onCheckedChange={v => setCustom(cf.field_name, v)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="primary" className="w-full" onClick={() => onSave({ ...form, custom_data: customData } as any)} disabled={!form.name?.trim()}>Salvar</Button>
    </div>
  );
}
