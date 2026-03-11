import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Upload, ArrowRight, ArrowLeft, Check, AlertTriangle, X, FileSpreadsheet, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useCRMStore } from '@/store/crmStore';
import { Lead } from '@/types/crm';
import {
  parseCSVText, suggestMapping, getCRMFields,
  validateRows, getNewOptions,
  type CSVRow, type ImportValidationResult,
} from '@/services/importService';
import { parseFile, getFileType } from '@/services/excelParser';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadImportModal({ open, onOpenChange }: Props) {
  const store = useCRMStore();
  const [step, setStep] = useState(1);

  // Step 1
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Step 2
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Step 3
  const [validationResults, setValidationResults] = useState<ImportValidationResult[]>([]);
  const [newOptions, setNewOptions] = useState<{ newOrigins: string[]; newInterestLevels: string[]; newTags: string[] }>({ newOrigins: [], newInterestLevels: [], newTags: [] });

  // Step 4
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; warnings: number } | null>(null);

  const resetAll = () => {
    setStep(1);
    setCsvHeaders([]);
    setCsvRows([]);
    setFileName('');
    setMapping({});
    setValidationResults([]);
    setNewOptions({ newOrigins: [], newInterestLevels: [], newTags: [] });
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 10MB)');
      return;
    }
    const fileType = getFileType(file);
    if (fileType === 'invalid') {
      toast.error('Formato não suportado. Use CSV, XLSX ou XLS.');
      return;
    }
    setFileName(file.name);

    try {
      let headers: string[];
      let rows: CSVRow[];

      if (fileType === 'csv') {
        const text = await file.text();
        const parsed = parseCSVText(text);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        const parsed = await parseFile(file);
        headers = parsed.headers;
        rows = parsed.rows;
      }

      if (headers.length === 0) {
        toast.error('Arquivo vazio ou inválido');
        return;
      }
      if (rows.length > 1000) {
        toast.error('Máximo 1.000 linhas por importação. Divida em múltiplos arquivos.');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      const suggested = suggestMapping(headers);
      setMapping(suggested);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const goToStep2 = () => {
    if (csvRows.length === 0) { toast.error('Carregue um arquivo CSV'); return; }
    setStep(2);
  };

  const goToStep3 = () => {
    const hasMappedName = Object.values(mapping).includes('name');
    const hasMappedEmailOrPhone = Object.values(mapping).includes('email') || Object.values(mapping).includes('phone');
    if (!hasMappedName || !hasMappedEmailOrPhone) {
      toast.error('Mapeie ao menos Nome e (Email ou Telefone)');
      return;
    }
    const results = validateRows(csvRows, mapping, store.leads);
    setValidationResults(results);
    const opts = getNewOptions(results, store.origins, store.interestLevels, store.tags);
    setNewOptions(opts);
    setStep(3);
  };

  const successCount = useMemo(() => validationResults.filter(r => r.status === 'success').length, [validationResults]);
  const errorCount = useMemo(() => validationResults.filter(r => r.status === 'error').length, [validationResults]);
  const warningCount = useMemo(() => validationResults.filter(r => r.status === 'warning').length, [validationResults]);

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);
    setStep(4);

    // Auto-create missing options
    for (const origin of newOptions.newOrigins) {
      store.addOrigin(origin);
    }
    for (const level of newOptions.newInterestLevels) {
      store.addInterestLevel({ id: crypto.randomUUID(), value: level.toLowerCase(), label: level });
    }
    for (const tagName of newOptions.newTags) {
      store.addTag({ id: crypto.randomUUID(), name: tagName, color: 'hsl(var(--primary))' });
    }

    const toImport = validationResults.filter(r => r.status === 'success' && r.data);
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < toImport.length; i++) {
      try {
        const data = toImport[i].data!;
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
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setImportResult({ success: imported, errors, warnings: warningCount });
    setImporting(false);
    if (imported > 0) toast.success(`${imported} leads importados!`);
  };

  const crmFields = getCRMFields();

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetAll(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Leads via CSV
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                s < step ? 'bg-success text-success-foreground'
                : s === step ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${s < step ? 'bg-success' : 'bg-muted'}`} />}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {step === 1 && 'Upload'}
            {step === 2 && 'Mapeamento'}
            {step === 3 && 'Validação'}
            {step === 4 && 'Resultado'}
          </span>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Arraste seu arquivo CSV aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar (máx 10MB)</p>
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            </div>

            {fileName && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{fileName}</span>
                  <Badge variant="secondary">{csvRows.length} linhas</Badge>
                </div>
                {csvRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {csvHeaders.map(h => <th key={h} className="px-2 py-1 text-left text-muted-foreground font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            {csvHeaders.map(h => <td key={h} className="px-2 py-1 text-foreground max-w-[120px] truncate">{row[h]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvRows.length > 3 && <p className="text-xs text-muted-foreground mt-1">... e mais {csvRows.length - 3} linhas</p>}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={goToStep2} disabled={csvRows.length === 0}>
                Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Mapeie as colunas do CSV para os campos do CRM:</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {csvHeaders.map(header => (
                <div key={header} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{header}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ex: {csvRows[0]?.[header]?.substring(0, 30) || '—'}
                    </span>
                  </div>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={mapping[header] || ''}
                    onValueChange={v => setMapping(prev => ({ ...prev, [header]: v }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecionar campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {crmFields.map(f => (
                        <SelectItem key={f.value} value={f.value || '_ignore'}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={goToStep3}>
                Validar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="secondary" className="bg-success/20 text-success">{successCount} válidos</Badge>
              {errorCount > 0 && <Badge variant="destructive">{errorCount} erros</Badge>}
              {warningCount > 0 && <Badge variant="secondary" className="bg-warning/20 text-warning">{warningCount} avisos</Badge>}
            </div>

            {/* New options to create */}
            {(newOptions.newOrigins.length > 0 || newOptions.newInterestLevels.length > 0 || newOptions.newTags.length > 0) && (
              <div className="rounded-lg border border-info/30 bg-info/5 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-info" /> Novos registros serão criados:
                </p>
                {newOptions.newOrigins.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Origens:</span>
                    {newOptions.newOrigins.map(o => <Badge key={o} variant="outline" className="text-xs">{o}</Badge>)}
                  </div>
                )}
                {newOptions.newInterestLevels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Níveis:</span>
                    {newOptions.newInterestLevels.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
                  </div>
                )}
                {newOptions.newTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Tags:</span>
                    {newOptions.newTags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </div>
            )}

            {/* Error/warning details */}
            {validationResults.filter(r => r.status !== 'success').length > 0 && (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {validationResults.filter(r => r.status !== 'success').map((r, i) => (
                  <div key={i} className={`text-xs p-2 rounded flex items-center gap-2 ${
                    r.status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                  }`}>
                    {r.status === 'error' ? <X className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    Linha {r.row}: {r.message}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleImport} disabled={successCount === 0}>
                Importar {successCount} leads <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <div className="space-y-4">
            {importing ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">Importando leads...</p>
                <Progress value={importProgress} className="w-full" />
                <p className="text-xs text-muted-foreground mt-2">{importProgress}%</p>
              </div>
            ) : importResult && (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-display text-foreground">Importação concluída!</p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{importResult.success}</p>
                    <p className="text-xs text-muted-foreground">importados</p>
                  </div>
                  {importResult.errors > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{importResult.errors}</p>
                      <p className="text-xs text-muted-foreground">erros</p>
                    </div>
                  )}
                  {importResult.warnings > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">{importResult.warnings}</p>
                      <p className="text-xs text-muted-foreground">avisos</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => { resetAll(); }}>
                    Importar mais
                  </Button>
                  <Button onClick={() => { onOpenChange(false); resetAll(); }}>
                    Voltar para Leads
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
