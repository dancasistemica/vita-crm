import { Badge, Button, Card, Dialog, Input, Label, Select, Textarea } from "@/components/ui/ds";
import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { Plus, MessageCircle } from "lucide-react";
import { Interaction, INTERACTION_TYPES } from "@/types/crm";
import { toast } from "sonner";
import AIResponseSuggestion from "@/components/ai/AIResponseSuggestion";

export default function InteracoesPage() {
  const { leads, interactions, addInteraction } = useCRMStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterLead, setFilterLead] = useState("all");

  const filtered = filterLead === "all" ? interactions : interactions.filter(i => i.leadId === filterLead);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const getLeadName = (id: string) => leads.find(l => l.id === id)?.name || '—';
  const getTypeLabel = (type: string) => INTERACTION_TYPES.find(t => t.value === type)?.label || type;

  const handleAdd = (data: Partial<Interaction>) => {
    const interaction: Interaction = {
      id: crypto.randomUUID(),
      leadId: data.leadId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      type: (data.type as Interaction['type']) || 'mensagem',
      note: data.note || '',
    };
    addInteraction(interaction);
    toast.success("Interação registrada!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-neutral-900">Interações</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><><Plus className="h-4 w-4 mr-1" /> Nova Interação</></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Nova Interação</DialogTitle></DialogHeader>
            <InteractionForm leads={leads} onSave={handleAdd} />
          </DialogContent>
        </Dialog>
      </div>

      <Select value={filterLead} onValueChange={setFilterLead}>
        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filtrar por lead" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os leads</SelectItem>
          {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-neutral-500 text-center py-8">Nenhuma interação registrada.</p>}
        {sorted.map(interaction => (
          <Card key={interaction.id}>
            <div>
              <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-sm">{getLeadName(interaction.leadId)}</span>
                  <Badge variant="secondary" className="text-xs">{getTypeLabel(interaction.type)}</Badge>
                  <span className="text-xs text-neutral-500">{interaction.date}</span>
                </div>
                <p className="text-sm text-neutral-500 mt-1">{interaction.note}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InteractionForm({ leads, onSave }: { leads: any[]; onSave: (data: Partial<Interaction>) => void }) {
  const { interactions, products, pipelineStages } = useCRMStore();
  const [form, setForm] = useState<Partial<Interaction>>({ date: new Date().toISOString().split('T')[0], type: 'mensagem' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const selectedLead = leads.find((l: any) => l.id === form.leadId);
  const leadInteractions = interactions.filter(i => i.leadId === form.leadId);
  const stageName = pipelineStages.find(s => s.id === selectedLead?.pipelineStage)?.name || '';

  return (
    <div className="space-y-3">
      <div>
        <Label>Lead</Label>
        <Select value={form.leadId || ''} onValueChange={v => set('leadId', v)}>
          <SelectTrigger><SelectValue placeholder="Selecionar lead" /></SelectTrigger>
          <SelectContent>{leads.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.type || 'mensagem'} onValueChange={v => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{INTERACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Data</Label><Input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} /></div>
      </div>
      <div><Label>Anotação</Label><Textarea value={form.note || ''} onChange={e => set('note', e.target.value)} /></div>

      {/* AI Response Suggestion */}
      {selectedLead && (
        <AIResponseSuggestion
          lead={selectedLead}
          interactions={leadInteractions}
          products={products}
          stageName={stageName}
        />
      )}

      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.leadId}>Salvar</Button>
    </div>
  );
}
