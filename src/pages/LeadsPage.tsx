import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { Lead } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, Instagram, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

const interestColors = { frio: 'bg-cold/20 text-cold', morno: 'bg-warm/20 text-warm', quente: 'bg-hot/20 text-hot' } as const;
const interestLabels = { frio: 'Frio', morno: 'Morno', quente: 'Quente' } as const;

export default function LeadsPage() {
  const { leads, origins, pipelineStages, addLead, deleteLead, updateLead } = useCRMStore();
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterInterest, setFilterInterest] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchOrigin = filterOrigin === "all" || l.origin === filterOrigin;
    const matchInterest = filterInterest === "all" || l.interestLevel === filterInterest;
    const matchStage = filterStage === "all" || l.pipelineStage === filterStage;
    return matchSearch && matchOrigin && matchInterest && matchStage;
  });

  const handleSave = (data: Partial<Lead>) => {
    if (editingLead) {
      updateLead(editingLead.id, data);
      toast.success("Lead atualizado!");
    } else {
      const newLead: Lead = {
        id: crypto.randomUUID(),
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        instagram: data.instagram || '',
        city: data.city || '',
        entryDate: data.entryDate || new Date().toISOString().split('T')[0],
        origin: data.origin || origins[0],
        interestLevel: data.interestLevel || 'frio',
        mainInterest: data.mainInterest || '',
        tags: data.tags || [],
        painPoint: data.painPoint || '',
        bodyTensionArea: data.bodyTensionArea || '',
        emotionalGoal: data.emotionalGoal || '',
        pipelineStage: data.pipelineStage || '1',
        responsible: data.responsible || '',
        notes: data.notes || '',
      };
      addLead(newLead);
      toast.success("Lead adicionado!");
    }
    setDialogOpen(false);
    setEditingLead(null);
  };

  const getStageName = (id: string) => pipelineStages.find(s => s.id === id)?.name || '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-display text-foreground">Leads</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingLead(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLead(null)}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            </DialogHeader>
            <LeadForm lead={editingLead} origins={origins} pipelineStages={pipelineStages} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterInterest} onValueChange={setFilterInterest}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos níveis</SelectItem>
            <SelectItem value="frio">Frio</SelectItem>
            <SelectItem value="morno">Morno</SelectItem>
            <SelectItem value="quente">Quente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {pipelineStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum lead encontrado.</p>}
        {filtered.map(lead => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{lead.name}</span>
                  <Badge variant="secondary" className={interestColors[lead.interestLevel]}>{interestLabels[lead.interestLevel]}</Badge>
                  <Badge variant="outline" className="text-xs">{getStageName(lead.pipelineStage)}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span>{lead.origin}</span>
                  <span>{lead.city}</span>
                  {lead.responsible && <span>→ {lead.responsible}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {lead.phone && (
                  <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.instagram && (
                  <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Instagram className="h-4 w-4" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLead(lead); setDialogOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { deleteLead(lead.id); toast.success("Lead removido"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LeadForm({ lead, origins, pipelineStages, onSave }: { lead: Lead | null; origins: string[]; pipelineStages: { id: string; name: string }[]; onSave: (data: Partial<Lead>) => void }) {
  const [form, setForm] = useState<Partial<Lead>>(lead || { interestLevel: 'frio', pipelineStage: '1', tags: [], entryDate: new Date().toISOString().split('T')[0] });
  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nome *</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
        <div><Label>Telefone / WhatsApp</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="5511999999999" /></div>
        <div><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
        <div><Label>Instagram</Label><Input value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="@usuario" /></div>
        <div><Label>Cidade</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
        <div><Label>Data de entrada</Label><Input type="date" value={form.entryDate || ''} onChange={e => set('entryDate', e.target.value)} /></div>
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
              <SelectItem value="frio">Frio</SelectItem>
              <SelectItem value="morno">Morno</SelectItem>
              <SelectItem value="quente">Quente</SelectItem>
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
        <div><Label>Responsável</Label><Input value={form.responsible || ''} onChange={e => set('responsible', e.target.value)} /></div>
      </div>
      <div><Label>Interesse principal</Label><Input value={form.mainInterest || ''} onChange={e => set('mainInterest', e.target.value)} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Dor principal</Label><Input value={form.painPoint || ''} onChange={e => set('painPoint', e.target.value)} /></div>
        <div><Label>Área de tensão</Label><Input value={form.bodyTensionArea || ''} onChange={e => set('bodyTensionArea', e.target.value)} /></div>
        <div><Label>Objetivo emocional</Label><Input value={form.emotionalGoal || ''} onChange={e => set('emotionalGoal', e.target.value)} /></div>
      </div>
      <div><Label>Tags (separadas por vírgula)</Label><Input value={(form.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} /></div>
      <div><Label>Observações</Label><Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.name?.trim()}>Salvar</Button>
    </div>
  );
}
