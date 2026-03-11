import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { getCRMFields, suggestMapping } from '@/services/importService';
import type { WizardState } from '@/hooks/useImportWizard';

interface Props {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}

export default function Step3Mapping({ state, update }: Props) {
  const crmFields = getCRMFields();
  const mappedValues = Object.values(state.mapping);
  const hasName = mappedValues.includes('name');
  const hasContact = mappedValues.includes('email') || mappedValues.includes('phone');
  const isValid = hasName && hasContact;

  const handleReset = () => {
    const suggested = suggestMapping(state.headers);
    update({ mapping: suggested });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Mapeamento de Colunas</h2>
          <p className="text-sm text-muted-foreground mt-1">Conecte cada coluna do arquivo ao campo correspondente</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Restaurar
        </Button>
      </div>

      {/* Validation status */}
      <div className="flex gap-2">
        <Badge variant={hasName ? 'secondary' : 'destructive'} className={hasName ? 'bg-success/10 text-success border-success/20' : ''}>
          {hasName ? '✓' : '✗'} Nome
        </Badge>
        <Badge variant={hasContact ? 'secondary' : 'destructive'} className={hasContact ? 'bg-success/10 text-success border-success/20' : ''}>
          {hasContact ? '✓' : '✗'} Email ou Telefone
        </Badge>
        {!isValid && (
          <span className="text-xs text-destructive self-center ml-2">Mapeie os campos obrigatórios</span>
        )}
      </div>

      {/* Mapping rows */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {state.headers.map(header => {
          const mapped = state.mapping[header];
          return (
            <div key={header} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{header}</p>
                <p className="text-xs text-muted-foreground truncate">
                  ex: {state.rows[0]?.[header]?.substring(0, 40) || '—'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={mapped || '_ignore'}
                onValueChange={v => update({ mapping: { ...state.mapping, [header]: v === '_ignore' ? '' : v } })}
              >
                <SelectTrigger className="w-[180px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {crmFields.map(f => (
                    <SelectItem key={f.value || '_ignore'} value={f.value || '_ignore'}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
