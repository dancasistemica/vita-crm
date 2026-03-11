import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { formatCPF, formatRG, validateCPF } from "@/services/cpfValidator";

interface LeadFormProps {
  lead: Lead | null;
  onSave: (data: Partial<Lead>) => void;
}

export default function LeadForm({ lead, onSave }: LeadFormProps) {
  const { origins, pipelineStages, users, tags, interestLevels } = useCRMStore();
  const activeUsers = users.filter(u => u.active);
  const defaultResponsible = activeUsers[0]?.name || '';

  const [form, setForm] = useState<Partial<Lead>>(
    lead || { interestLevel: interestLevels[0]?.value || 'frio', pipelineStage: '1', tags: [], entryDate: new Date().toISOString().split('T')[0], responsible: defaultResponsible }
  );

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

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
          <Select value={form.responsible || ''} onValueChange={v => set('responsible', v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              {activeUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Interesse principal</Label><Input value={form.mainInterest || ''} onChange={e => set('mainInterest', e.target.value)} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Dor principal</Label><Textarea value={form.painPoint || ''} onChange={e => set('painPoint', e.target.value)} className="min-h-[60px]" /></div>
        <div><Label>Área de tensão no corpo</Label><Textarea value={form.bodyTensionArea || ''} onChange={e => set('bodyTensionArea', e.target.value)} className="min-h-[60px]" /></div>
        <div><Label>Objetivo emocional</Label><Textarea value={form.emotionalGoal || ''} onChange={e => set('emotionalGoal', e.target.value)} className="min-h-[60px]" /></div>
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
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.name?.trim()}>Salvar</Button>
    </div>
  );
}
