import { useState } from "react";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { 
  Button, 
  Dialog, 
  Label, 
  Select, 
  Badge,
  Textarea,
  Input
} from "@/components/ui/ds";
import { X, Save, AlertCircle } from "lucide-react";

interface MassEditModalProps {
  selectedLeadsCount: number;
  onClose: () => void;
  onSave: (updates: Partial<LeadView>) => Promise<void>;
}

export default function MassEditModal({ selectedLeadsCount, onClose, onSave }: MassEditModalProps) {
  const { pipelineStages, interestLevels, tags: allTags, origins } = useLeadsData();
  const [updates, setUpdates] = useState<Partial<LeadView>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof LeadView, value: any) => {
    setUpdates(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tagName: string) => {
    const current = updates.tags || [];
    if (current.includes(tagName)) {
      set('tags', current.filter((t: string) => t !== tagName));
    } else {
      set('tags', [...current, tagName]);
    }
  };

  const handleSave = async () => {
    if (Object.keys(updates).length === 0) return;
    setLoading(true);
    try {
      await onSave(updates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose} title={`Edição em Massa - ${selectedLeadsCount} Leads`}>
      <div className="space-y-4 pt-2">
        <div className="bg-primary-50 border border-primary-100 p-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-xs text-primary-800 leading-relaxed">
            As alterações abaixo serão aplicadas a <strong>todos os {selectedLeadsCount} leads</strong> selecionados. 
            Campos deixados em branco não serão alterados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            label="Etapa do Funil"
            value={updates.pipelineStage || ''} 
            onChange={e => set('pipelineStage', e.target.value)}
            placeholder="Não alterar"
            options={pipelineStages.map(s => ({ value: s.id, label: s.name }))}
          />

          <Select 
            label="Nível de Interesse"
            value={updates.interestLevel || ''} 
            onChange={e => set('interestLevel', e.target.value)}
            placeholder="Não alterar"
            options={interestLevels.map(l => ({ value: l.value, label: l.label }))}
          />

          <Select 
            label="Origem"
            value={updates.origin || ''} 
            onChange={e => set('origin', e.target.value)}
            placeholder="Não alterar"
            options={origins.map(o => ({ value: o, label: o }))}
          />

          <Input 
            label="Responsável" 
            value={updates.responsible || ''} 
            onChange={e => set('responsible', e.target.value)} 
            placeholder="Não alterar" 
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tags (Substituirá as tags existentes nos leads selecionados)</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {allTags.map(t => (
              <Badge
                key={t.id}
                variant={(updates.tags || []).includes(t.name) ? "default" : "neutral"}
                className="cursor-pointer"
                onClick={() => toggleTag(t.name)}
              >
                {t.name}
                {(updates.tags || []).includes(t.name) && <X className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        <Textarea 
          label="Observações" 
          value={updates.notes || ''} 
          onChange={e => set('notes', e.target.value)} 
          placeholder="Não alterar"
          className="min-h-[80px]"
        />

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSave} 
            disabled={loading || Object.keys(updates).length === 0}
            icon={<Save className="w-4 h-4" />}
          >
            {loading ? 'Salvando...' : 'Aplicar Alterações'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
