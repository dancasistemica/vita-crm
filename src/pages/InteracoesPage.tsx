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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Interações</h1>
        <Button onClick={() => setDialogOpen(true)} icon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
          Nova Interação
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Nova Interação">
          <InteractionForm leads={leads} onSave={handleAdd} />
        </Dialog>
      </div>

      <Select value={filterLead} onValueChange={setFilterLead}>
        
        
          <option value="all">Todos os leads</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        
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
          
          {leads.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.type || 'mensagem'} onValueChange={v => set('type', v)}>
            
            {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
