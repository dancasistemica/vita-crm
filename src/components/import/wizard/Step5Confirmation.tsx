import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Check, FileSpreadsheet } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';
import { Lead } from '@/types/crm';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { WizardState } from '@/hooks/useImportWizard';

interface Props {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  reset: () => void;
}

export default function Step5Confirmation({ state, update, reset }: Props) {
  const store = useCRMStore();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  const successItems = state.validationResults.filter(r => r.status === 'success' && r.data);
  const errorCount = state.validationResults.filter(r => r.status === 'error').length;
  const warningCount = state.validationResults.filter(r => r.status === 'warning').length;

  const handleImport = async () => {
    update({ importing: true, importProgress: 0 });

    // Auto-create missing options
    for (const origin of state.newOptions.newOrigins) store.addOrigin(origin);
    for (const level of state.newOptions.newInterestLevels) {
      store.addInterestLevel({ id: crypto.randomUUID(), value: level.toLowerCase(), label: level });
    }
    for (const tagName of state.newOptions.newTags) {
      store.addTag({ id: crypto.randomUUID(), name: tagName, color: 'hsl(var(--primary))' });
    }

    let imported = 0;
    let errors = 0;

    for (let i = 0; i < successItems.length; i++) {
      try {
        const data = successItems[i].data!;
        const newLead: Lead = {
          id: crypto.randomUUID(),
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          instagram: data.instagram || '',
          city: data.city || '',
          entryDate: data.entryDate || new Date().toISOString().split('T')[0],
          origin: data.origin || store.origins[0] || '',
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
        store.addLead(newLead);
        imported++;
      } catch {
        errors++;
      }
      update({ importProgress: Math.round(((i + 1) / successItems.length) * 100) });
    }

    update({ importing: false, importResult: { success: imported, errors, warnings: warningCount } });
    if (imported > 0) toast.success(`${imported} leads importados com sucesso!`);
  };

  // Import in progress
  if (state.importing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <p className="text-lg font-display text-foreground">Importando leads...</p>
        <Progress value={state.importProgress} className="w-full max-w-sm" />
        <p className="text-sm text-muted-foreground">{state.importProgress}%</p>
      </div>
    );
  }

  // Import complete
  if (state.importResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center">
          <Check className="h-10 w-10 text-success" />
        </div>
        <p className="text-2xl font-display text-foreground">Importação concluída!</p>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-success">{state.importResult.success}</p>
            <p className="text-xs text-muted-foreground">importados</p>
          </div>
          {state.importResult.errors > 0 && (
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{state.importResult.errors}</p>
              <p className="text-xs text-muted-foreground">erros</p>
            </div>
          )}
          {state.importResult.warnings > 0 && (
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{state.importResult.warnings}</p>
              <p className="text-xs text-muted-foreground">avisos</p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset}>Importar mais</Button>
          <Button onClick={() => navigate('/leads')}>Ver Leads</Button>
        </div>
      </div>
    );
  }

  // Confirmation screen
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display text-foreground">Confirmação</h2>
        <p className="text-sm text-muted-foreground mt-1">Revise o resumo antes de importar</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Você está prestes a importar</p>
        <p className="text-5xl font-bold text-primary">{successItems.length}</p>
        <p className="text-lg font-display text-foreground">leads</p>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          {state.newOptions.newOrigins.length + state.newOptions.newInterestLevels.length + state.newOptions.newTags.length > 0 && (
            <span>Novos registros: {state.newOptions.newOrigins.length + state.newOptions.newInterestLevels.length + state.newOptions.newTags.length}</span>
          )}
          {warningCount > 0 && <span className="text-warning">Avisos: {warningCount}</span>}
          {errorCount > 0 && <span className="text-destructive">Ignorados: {errorCount}</span>}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} className="mt-0.5" />
          <span className="text-sm text-muted-foreground">
            Confirmo que revisei os dados. Linhas inválidas serão ignoradas e os leads válidos serão adicionados ao CRM.
          </span>
        </label>
      </div>

      <Button onClick={handleImport} disabled={!confirmed} size="lg" className="w-full gap-2">
        <Check className="h-4 w-4" /> Importar {successItems.length} leads
      </Button>
    </div>
  );
}
