import { useEffect, useMemo, useState } from 'react';
import { Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { validateRows, getNewOptions } from '@/services/importService';
import { detectDuplicates } from '@/services/duplicateDetectionService';
import { ImportModalState, DuplicateMatch } from '@/hooks/useImportModal';
import { Lead } from '@/types/crm';
import { convertExcelSerialToISO, isExcelSerialDate } from '@/utils/dateConversion';

interface Props {
  state: ImportModalState;
  update: (patch: Partial<ImportModalState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Map camelCase lead data to snake_case DB columns */
function toDbRecord(data: Partial<Lead>, organizationId: string) {
  return {
    organization_id: organizationId,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    instagram: data.instagram || '',
    city: data.city || '',
    rg: data.rg || '',
    cpf: data.cpf || '',
    entry_date: data.entryDate || new Date().toISOString().split('T')[0],
    origin: data.origin || '',
    interest_level: data.interestLevel || 'frio',
    main_interest: data.mainInterest || '',
    tags: data.tags || [],
    custom_data: {
      pain_point: (data as any).painPoint || '',
      body_tension_area: (data as any).bodyTensionArea || '',
      emotional_goal: (data as any).emotionalGoal || '',
    },
    pipeline_stage: data.pipelineStage || '1',
    responsible: data.responsible || '',
    notes: data.notes || '',
  };
}

export default function Step5Import({ state, update, onNext, onBack }: Props) {
  const { organizationId } = useOrganization();
  const [existingLeads, setExistingLeads] = useState<any[]>([]);

  const convertRecordDates = (record: Record<string, any>) => {
    const dateColumns = ['entry_date', 'created_at', 'updated_at', 'due_date'];
    let convertedCount = 0;

    dateColumns.forEach(col => {
      if (!record[col]) return;
      if (!isExcelSerialDate(record[col])) return;

      const iso = convertExcelSerialToISO(record[col]);
      if (iso) {
        console.log(`[DateConversion] ${col}: ${record[col]} → ${iso}`);
        record[col] = iso;
        convertedCount++;
      } else {
        console.warn(`[DateConversion] Falha ao converter ${col}:`, record[col]);
        record[col] = null;
      }
    });

    return convertedCount;
  };

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
  const [dbStages, setDbStages] = useState<{ id: string; name: string }[]>([]);
  const [enumLoading, setEnumLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    const fetch = async () => {
      setEnumLoading(true);
      const [originsRes, levelsRes, tagsRes, stagesRes] = await Promise.all([
        supabase.from('lead_origins').select('name').eq('organization_id', organizationId),
        supabase.from('interest_levels').select('value').eq('organization_id', organizationId),
        supabase.from('tags').select('name').eq('organization_id', organizationId),
        supabase.from('pipeline_stages').select('id, name').eq('organization_id', organizationId),
      ]);
      setDbOrigins((originsRes.data || []).map(o => o.name));
      setDbInterestLevels(levelsRes.data || []);
      setDbTags(tagsRes.data || []);
      setDbStages(stagesRes.data || []);
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
        newOptions: { newOrigins: [], newInterestLevels: [], newTags: opts.newTags },
        duplicates,
      });
    }
  }, [existingLeads, dbOrigins, dbInterestLevels, dbTags]);

  useEffect(() => {
    if (state.validationResults.length === 0 || enumLoading) return;

    const originNames = new Set(dbOrigins.map(o => o.toLowerCase()));
    const levelValues = new Set(dbInterestLevels.map(l => l.value.toLowerCase()));
    const stageIds = new Set(dbStages.map(s => s.id.toLowerCase()));
    const stageNames = new Set(dbStages.map(s => s.name.toLowerCase()));

    const errorRows: { rowIndex: number; errors: string[] }[] = [];
    const updatedResults = state.validationResults.map(r => {
      if (r.status !== 'success' || !r.data) return r;
      const errors: string[] = [];

      if (r.data.origin && !originNames.has(r.data.origin.toLowerCase())) {
        errors.push(`Origem "${r.data.origin}" não existe`);
      }

      if (r.data.interestLevel && !levelValues.has(r.data.interestLevel.toLowerCase())) {
        errors.push(`Nível de interesse "${r.data.interestLevel}" não existe`);
      }

      if (
        r.data.pipelineStage &&
        !stageIds.has(r.data.pipelineStage.toLowerCase()) &&
        !stageNames.has(r.data.pipelineStage.toLowerCase())
      ) {
        errors.push(`Etapa "${r.data.pipelineStage}" não existe`);
      }

      if (errors.length > 0) {
        errorRows.push({ rowIndex: r.row, errors });
        return { ...r, status: 'error', message: errors.join(', ') };
      }

      return r;
    });

    const resultsChanged = updatedResults.some((r, i) => {
      const prev = state.validationResults[i];
      return r.status !== prev?.status || r.message !== prev?.message;
    });

    const nextInvalidRows = errorRows.length > 0 ? errorRows : null;
    const invalidRowsChanged = JSON.stringify(nextInvalidRows) !== JSON.stringify(state.invalidRows || null);

    if (resultsChanged || invalidRowsChanged) {
      if (errorRows.length > 0) {
        console.error('[ImportValidation] Erros encontrados:', errorRows);
      } else {
        console.log('[ImportValidation] Todos os valores são válidos');
      }

      update({
        validationResults: updatedResults,
        invalidRows: nextInvalidRows,
        error: errorRows.length > 0
          ? `${errorRows.length} linhas com valores inválidos. Verifique os dados.`
          : null,
      });
    }
  }, [state.validationResults, dbOrigins, dbInterestLevels, dbStages, enumLoading, state.invalidRows, update]);

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

    update({
      importing: true,
      importProgress: 0,
      importProcessed: 0,
      importTotal: 0,
      dateConversions: state.dateConversions,
    });

    // Auto-create missing tags in DB
    for (const tagName of state.newOptions.newTags) {
      await supabase.from('tags').insert({
        name: tagName,
        color: 'hsl(var(--primary))',
        organization_id: organizationId,
      });
    }

    const toImport = state.validationResults.filter(r => r.status === 'success' && r.data);
    const dupRows = new Set(state.duplicates.map(d => d.rowIndex));
    const cleanToImport = toImport.filter(r => !dupRows.has(r.row));

    let created = 0, updated = 0, duplicated = 0, errors = 0;
    let dateConversions = state.dateConversions;
    const total = cleanToImport.length + state.duplicates.filter(d => d.action !== 'skip').length;
    let processed = 0;

    update({ importTotal: total });

    // Batch insert clean leads (chunks of 50)
    const BATCH_SIZE = 50;
    for (let i = 0; i < cleanToImport.length; i += BATCH_SIZE) {
      const batch = cleanToImport.slice(i, i + BATCH_SIZE);
      const records = batch.map(item => {
        const record = toDbRecord(item.data!, organizationId);
        dateConversions += convertRecordDates(record);
        return record;
      });

      const { data, error } = await supabase.from('leads').insert(records).select('id');

      if (error) {
        console.error('[Step5Import] Batch insert error:', error);
        errors += batch.length;
      } else {
        created += data?.length || batch.length;
      }

      processed += batch.length;
      update({
        importProgress: Math.round((processed / Math.max(total, 1)) * 100),
        importProcessed: processed,
        dateConversions,
      });
    }

    // Handle duplicates
    for (const dup of state.duplicates) {
      if (dup.action === 'skip') continue;
      try {
        if (dup.action === 'update') {
          const updateData = toDbRecord(dup.newData as Partial<Lead>, organizationId);
          delete (updateData as any).organization_id; // Don't update org_id
          dateConversions += convertRecordDates(updateData as Record<string, any>);
          const { error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', dup.existingLeadId)
            .eq('organization_id', organizationId);
          if (error) { console.error('[Step5Import] Update error:', error); errors++; }
          else updated++;
        } else if (dup.action === 'duplicate') {
          const record = toDbRecord(dup.newData as Partial<Lead>, organizationId);
          dateConversions += convertRecordDates(record as Record<string, any>);
          const { error } = await supabase.from('leads').insert(record);
          if (error) { console.error('[Step5Import] Duplicate insert error:', error); errors++; }
          else duplicated++;
        }
      } catch { errors++; }
      processed++;
      update({
        importProgress: Math.round((processed / Math.max(total, 1)) * 100),
        importProcessed: processed,
        dateConversions,
      });
    }

    update({ importResult: { created, updated, duplicated, errors, dateConversions }, importing: false });
    console.log('[Step5Import] ✅ Import done (Supabase):', { created, updated, duplicated, errors, dateConversions });
    onNext();
  };

  if (state.importing) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Salvando leads no banco de dados...</p>
          <p className="text-sm text-muted-foreground">✓ Convertendo datas do Excel...</p>
          <p className="text-xs text-muted-foreground">
            {state.importProcessed} / {state.importTotal} leads processados
          </p>
        </div>
        <Progress value={state.importProgress} className="w-full max-w-sm mx-auto" />
        <p className="text-xs text-muted-foreground">{state.importProgress}%</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <h3 className="text-lg font-display text-foreground text-center">Validação e Importação</h3>

      {/* Summary badges */}
      <div className="flex gap-2 justify-center flex-wrap">
        <Badge variant="secondary" className="bg-success/20 text-success">{successCount} novos</Badge>
        {state.duplicates.length > 0 && <Badge variant="secondary" className="bg-warning/20 text-warning">{state.duplicates.length} duplicatas</Badge>}
        {errorCount > 0 && <Badge variant="destructive">{errorCount} erros</Badge>}
        {warningCount > 0 && <Badge variant="secondary" className="bg-accent/20 text-accent">{warningCount} avisos</Badge>}
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na Importação</AlertTitle>
          <AlertDescription>
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
          </AlertDescription>
        </Alert>
      )}

      {/* New options */}
      {state.newOptions.newTags.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Novas tags a criar automaticamente:</p>
          {state.newOptions.newTags.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[11px] text-muted-foreground">Tags:</span>
              {state.newOptions.newTags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
            </div>
          )}
        </div>
      )}

      {/* Duplicates section */}
      {state.duplicates.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3 text-warning" /> Duplicatas detectadas ({state.duplicates.length})
          </p>
          <div className="max-h-[180px] overflow-y-auto space-y-1.5">
            {state.duplicates.map((dup, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border/50 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{dup.newData.name}</p>
                  <p className="text-muted-foreground">
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
        <Button variant="outline" onClick={onBack}>Voltar</Button>
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
