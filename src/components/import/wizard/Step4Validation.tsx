import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, X, Plus } from 'lucide-react';
import { validateRows, getNewOptions } from '@/services/importService';
import { useCRMStore } from '@/store/crmStore';
import type { WizardState } from '@/hooks/useImportWizard';

interface Props {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}

export default function Step4Validation({ state, update }: Props) {
  const store = useCRMStore();

  useEffect(() => {
    const results = validateRows(state.rows, state.mapping, store.leads);
    const opts = getNewOptions(results, store.origins, store.interestLevels, store.tags);
    update({ validationResults: results, newOptions: opts });
  }, [state.rows, state.mapping, store.leads, store.origins, store.interestLevels, store.tags]);

  const successCount = state.validationResults.filter(r => r.status === 'success').length;
  const errorCount = state.validationResults.filter(r => r.status === 'error').length;
  const warningCount = state.validationResults.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display text-foreground">Validação dos Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">Resultado da validação de {state.rows.length} linhas</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
          <p className="text-2xl font-bold text-success">{successCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Válidos</p>
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{warningCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Avisos</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{errorCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Erros</p>
        </div>
      </div>

      {/* New options */}
      {(state.newOptions.newOrigins.length > 0 || state.newOptions.newInterestLevels.length > 0 || state.newOptions.newTags.length > 0) && (
        <div className="rounded-lg border border-info/30 bg-info/5 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-info" /> Novos registros serão criados automaticamente:
          </p>
          {state.newOptions.newOrigins.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground w-16 shrink-0">Origens:</span>
              {state.newOptions.newOrigins.map(o => <Badge key={o} variant="outline" className="text-xs">{o}</Badge>)}
            </div>
          )}
          {state.newOptions.newInterestLevels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground w-16 shrink-0">Níveis:</span>
              {state.newOptions.newInterestLevels.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
            </div>
          )}
          {state.newOptions.newTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground w-16 shrink-0">Tags:</span>
              {state.newOptions.newTags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
            </div>
          )}
        </div>
      )}

      {/* Errors / warnings */}
      {(errorCount > 0 || warningCount > 0) && (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {state.validationResults.filter(r => r.status !== 'success').map((r, i) => (
            <div key={i} className={`text-xs p-2.5 rounded-lg flex items-center gap-2 ${
              r.status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
            }`}>
              {r.status === 'error' ? <X className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
              <span>Linha {r.row}: {r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
