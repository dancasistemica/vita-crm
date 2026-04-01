import { Alert, AlertDescription, AlertTitle, Badge, Button, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/ds";
import { useEffect, useMemo, useState } from 'react';
import { Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { validateRows, getNewOptions, processImportedLeads } from '@/services/importService';
import { detectDuplicates } from '@/services/duplicateDetectionService';
import { ImportModalState, DuplicateMatch } from '@/hooks/useImportModal';
import { Lead } from '@/types/crm';

interface Props {
  state: ImportModalState;
  update: (patch: Partial<ImportModalState>) => void;
  onNext: () => void;
  onBack: () => void;
}


export default function Step5Import({ state, update, onNext, onBack }: Props) {
  const { organizationId } = useOrganization();
  const [existingLeads, setExistingLeads] = useState<any[]>([]);

  // Fetch existing leads from DB for duplicate detection
  useEffect(() => {
    if (!organizationId) return;
    const fetchLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, name, email, phone')
        .eq('organization_id', organizationId);
      setExistingLeads(data || []);
      console.log('[Step5Import] Existing leads from DB:', data?.length);
    };
    fetchLeads();
  }, [organizationId]);

  // Fetch existing origins, interest levels, tags from DB
  const [dbOrigins, setDbOrigins] = useState<string[]>([]);
  const [dbInterestLevels, setDbInterestLevels] = useState<{ value: string }[]>([]);
  const [dbTags, setDbTags] = useState<{ name: string }[]>([]);
  const [enumLoading, setEnumLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    const fetch = async () => {
      setEnumLoading(true);
      const [originsRes, levelsRes, tagsRes] = await Promise.all([
        supabase.from('lead_origins').select('name').eq('organization_id', organizationId),
        supabase.from('interest_levels').select('value').eq('organization_id', organizationId),
        supabase.from('tags').select('name').eq('organization_id', organizationId),
      ]);
      setDbOrigins((originsRes.data || []).map(o => o.name));
      setDbInterestLevels(levelsRes.data || []);
      setDbTags(tagsRes.data || []);
      setEnumLoading(false);
    };
    fetch();
  }, [organizationId]);

  // Run validation when we have existing leads and csv data
  useEffect(() => {
    if (state.validationResults.length === 0 && state.csvRows.length > 0 && existingLeads !== null) {
      console.log('[Step5Import] Running validation...');
      // Map DB leads to Lead-like objects for duplicate detection
      const mappedLeads = existingLeads.map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email || '',
        phone: l.phone || '',
      })) as Lead[];

      const results = validateRows(state.csvRows, state.mapping, mappedLeads);
      const opts = getNewOptions(results, dbOrigins, dbInterestLevels, dbTags);

      // Re-run duplicate detection with full lead objects
      const { duplicates } = detectDuplicates(results, mappedLeads);

      update({
        validationResults: results,
        newOptions: { newOrigins: opts.newOrigins, newInterestLevels: opts.newInterestLevels, newTags: opts.newTags },
        duplicates,
      });
    }
  }, [existingLeads, dbOrigins, dbInterestLevels, dbTags]);

  useEffect(() => {
    if (state.validationResults.length === 0 || enumLoading) return;
    if (state.invalidRows || state.error) {
      update({ invalidRows: null, error: null });
    }
    console.log('[ImportValidation] Validação concluída sem bloqueios de origem/nível/etapa');
  }, [state.validationResults, enumLoading, state.invalidRows, state.error, update]);

  const successCount = useMemo(() => state.validationResults.filter(r => r.status === 'success').length - state.duplicates.length, [state.validationResults, state.duplicates]);
  const errorCount = useMemo(() => state.validationResults.filter(r => r.status === 'error').length, [state.validationResults]);
  const warningCount = useMemo(() => state.validationResults.filter(r => r.status === 'warning').length, [state.validationResults]);

  const updateDuplicateAction = (index: number, action: DuplicateMatch['action']) => {
    const updated = [...state.duplicates];
    updated[index] = { ...updated[index], action };
    update({ duplicates: updated });
  };

  const handleImport = async () => {
    if (!organizationId) {
      console.error('[Step5Import] No organizationId!');
      return;
    }

    if (state.invalidRows && state.invalidRows.length > 0) {
      update({
        error: `${state.invalidRows.length} linhas com valores inválidos. Verifique os dados.`,
      });
      return;
    }

    const duplicateMap = new Map(state.duplicates.map(d => [d.rowIndex, d]));
    const rowsToImport = state.validationResults
      .filter(r => r.status !== 'error' && r.data)
      .filter(r => {
        const dup = duplicateMap.get(r.row);
        return !dup || dup.action !== 'skip';
      })
      .map(r => {
        const data = r.data as Partial<Lead>;
        const tagsValue = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || '');

        return {
          __lineNumber: r.row,
          nome: data.name || '',
          telefone: data.phone || '',
          email: data.email || '',
          instagram: data.instagram || '',
          cidade: data.city || '',
          data_entrada: data.entryDate || '',
          origem: data.origin || '',
          nivel_interesse: data.interestLevel || '',
          etapa_funil: data.pipelineStage || '',
          interesse_principal: data.mainInterest || '',
          dor_principal: (data as any).painPoint || '',
          area_tensao: (data as any).bodyTensionArea || '',
          objetivo_emocional: (data as any).emotionalGoal || '',
          tags: tagsValue,
          observacoes: data.notes || '',
        };
      });

    update({
      importing: true,
      importProgress: 0,
      importProcessed: 0,
      importTotal: rowsToImport.length,
      dateConversions: state.dateConversions,
    });

    try {
      const result = await processImportedLeads(organizationId, rowsToImport);
      update({
        importProgress: 100,
        importProcessed: rowsToImport.length,
        importResult: {
          created: result.created,
          updated: result.updated,
          converted: result.converted,
          errors: result.errors,
          dateConversions: state.dateConversions,
        },
        importing: false,
      });
      console.log('[Step5Import] ✅ Import done:', result);
      onNext();
    } catch (error) {
      update({ importing: false, error: error instanceof Error ? error.message : 'Erro ao importar leads' });
    }
  };

  if (state.importing) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">Salvando leads no banco de dados...</p>
          <p className="text-sm text-neutral-500">✓ Convertendo datas do Excel...</p>
          <p className="text-xs text-neutral-500">
            {state.importProcessed} / {state.importTotal} leads processados
          </p>
        </div>
        <Progress value={state.importProgress} className="w-full max-w-sm mx-auto" />
        <p className="text-xs text-neutral-500">{state.importProgress}%</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <h3 className="text-lg font-semibold text-neutral-700">Validação e Importação</h3>

      {/* Summary badges */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Badge variant="secondary" className="bg-success/20 text-success">{successCount} novos</Badge>
        {state.duplicates.length > 0 && <Badge variant="secondary" className="bg-warning/20 text-warning">{state.duplicates.length} duplicatas</Badge>}
        {errorCount > 0 && <Badge variant="error">{errorCount} erros</Badge>}
        {warningCount > 0 && <Badge variant="secondary" className="bg-accent/20 text-accent">{warningCount} avisos</Badge>}
      </div>

      {state.error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <h3 className="text-lg font-semibold mb-1">Erro na Importação</h3>
          <p className="text-sm">
            {state.error}
            {state.invalidRows && (
              <div className="mt-2 text-sm">
                <p>Linhas com problemas:</p>
                <ul className="list-disc pl-5">
                  {state.invalidRows.slice(0, 5).map(row => (
                    <li key={row.rowIndex}>
                      Linha {row.rowIndex}: {row.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </p>
        </Alert>
      )}

      {/* New options */}
      {state.newOptions.newTags.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Novas tags a criar automaticamente:</p>
          {state.newOptions.newTags.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[11px] text-neutral-500">Tags:</span>
              {state.newOptions.newTags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
            </div>
          )}
        </div>
      )}

      {/* Duplicates section */}
      {state.duplicates.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3 text-warning" /> Duplicatas detectadas ({state.duplicates.length})
          </p>
          <div className="max-h-[180px] overflow-y-auto space-y-1.5">
            {state.duplicates.map((dup, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2 rounded bg-background border border-border/50 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{dup.newData.name}</p>
                  <p className="text-neutral-500">
                    Já existe por {dup.matchField === 'email' ? 'email' : 'telefone'}: <span className="font-medium">{dup.matchValue}</span>
                    {' '}(lead: {dup.existingName})
                  </p>
                </div>
                <Select value={dup.action} onValueChange={v => updateDuplicateAction(i, v as DuplicateMatch['action'])}>
                  <SelectTrigger className="w-[110px] h-7 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Ignorar</SelectItem>
                    <SelectItem value="update">Atualizar</SelectItem>
                    <SelectItem value="duplicate">Duplicar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {state.validationResults.filter(r => r.status === 'error').length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <X className="h-3 w-3 text-destructive" /> Erros ({errorCount})
          </p>
          <div className="max-h-[120px] overflow-y-auto space-y-0.5">
            {state.validationResults.filter(r => r.status === 'error').map((r, i) => (
              <p key={i} className="text-[11px] text-destructive">Linha {r.row}: {r.message}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={handleImport} disabled={!organizationId || (successCount === 0 && state.duplicates.filter(d => d.action !== 'skip').length === 0)}>
          Importar {successCount + state.duplicates.filter(d => d.action !== 'skip').length} leads
        </Button>
      </div>

      {state.importResult && state.importResult.dateConversions > 0 && (
        <div className="text-center text-xs text-blue-600">
          ℹ {state.importResult.dateConversions} datas convertidas do formato Excel
        </div>
      )}
    </div>
  );
}
