import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLeadsData } from '@/hooks/useLeadsData';
import { Alert, Button, Checkbox, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/components/ui/ds";

type EditableType = 'leads' | 'clients';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  type: EditableType;
  onSuccess: () => void;
}

const LEAD_FIELDS = [
  { value: 'origin', label: 'Origem', inputType: 'select' },
  { value: 'interestLevel', label: 'Nível de Interesse', inputType: 'select' },
  { value: 'pipelineStage', label: 'Etapa do Funil', inputType: 'select' },
  { value: 'responsible', label: 'Responsável', inputType: 'select' },
  { value: 'tags', label: 'Tags', inputType: 'multi' },
  { value: 'notes', label: 'Observações', inputType: 'textarea' },
];

const CLIENT_FIELDS = [
  { value: 'responsible', label: 'Responsável', inputType: 'select' },
  { value: 'notes', label: 'Observações', inputType: 'textarea' },
];

export default function BulkEditModal({ open, onOpenChange, selectedIds, type, onSuccess }: Props) {
  const { origins, interestLevels, pipelineStages, tags, updateLead } = useLeadsData();
  const [selectedField, setSelectedField] = useState('');
  const [value, setValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fields = type === 'leads' ? LEAD_FIELDS : CLIENT_FIELDS;
  const currentFieldDef = fields.find(f => f.value === selectedField);

  const getFieldLabel = () => fields.find(f => f.value === selectedField)?.label || selectedField;

  const getDisplayValue = () => {
    if (selectedField === 'tags') return selectedTags.join(', ');
    if (selectedField === 'origin') return value;
    if (selectedField === 'interestLevel') return interestLevels.find(l => l.value === value)?.label || value;
    if (selectedField === 'pipelineStage') return pipelineStages.find(s => s.id === value)?.name || value;
    return value;
  };

  const handleApply = async () => {
    if (!selectedField) return;
    setLoading(true);

    try {
      for (const id of selectedIds) {
        const updateData: Record<string, any> = {};
        if (selectedField === 'tags') {
          updateData.tags = selectedTags;
        } else {
          updateData[selectedField] = value;
        }
        console.log('[BulkEditModal] Atualizando lead:', { id, updateData });
        await updateLead(id, updateData);
      }

      toast.success(`${selectedIds.length} registros atualizados!`);
      onSuccess();
      onOpenChange(false);
      setSelectedField('');
      setValue('');
      setSelectedTags([]);
    } catch (error) {
      console.error('[BulkEditModal] Erro:', error);
      toast.error('Erro ao atualizar registros');
    } finally {
      setLoading(false);
    }
  };

  const hasValue = selectedField === 'tags' ? selectedTags.length > 0 : !!value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Editar em massa ({selectedIds.length} registros)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Qual campo deseja alterar?</Label>
            <Select value={selectedField} onValueChange={v => { setSelectedField(v); setValue(''); setSelectedTags([]); }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione um campo" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedField && currentFieldDef && (
            <div>
              <Label className="text-sm">Novo valor</Label>
              {currentFieldDef.inputType === 'textarea' && (
                <Textarea value={value} onChange={e => setValue(e.target.value)} className="mt-1" rows={3} placeholder="Digite o novo valor..." />
              )}
              {currentFieldDef.inputType === 'select' && selectedField === 'origin' && (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {currentFieldDef.inputType === 'select' && selectedField === 'interestLevel' && (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {interestLevels.map(l => <SelectItem key={l.id} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {currentFieldDef.inputType === 'select' && selectedField === 'pipelineStage' && (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {currentFieldDef.inputType === 'select' && selectedField === 'responsible' && (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={value || 'none'}>{value || 'Selecionar'}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {currentFieldDef.inputType === 'multi' && selectedField === 'tags' && (
                <div className="mt-1 space-y-3 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTags.includes(tag.name)}
                        onCheckedChange={checked => {
                          if (checked) setSelectedTags(prev => [...prev, tag.name]);
                          else setSelectedTags(prev => prev.filter(t => t !== tag.name));
                        }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedField && hasValue && (
            <div className="bg-info/10 border border-info/20 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                Você vai alterar <strong>{getFieldLabel()}</strong> para <strong>{getDisplayValue()}</strong> em{' '}
                <strong>{selectedIds.length}</strong> registros.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleApply} disabled={!selectedField || !hasValue || loading}>
            {loading ? 'Atualizando...' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
