import { useState, useCallback } from 'react';
import { Upload, CheckCircle, X, FileSpreadsheet, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { parseCSVText, suggestMapping, getCRMFields, type CSVRow } from '@/services/importService';
import { parseFile, getFileType } from '@/services/excelParser';
import { ImportModalState } from '@/hooks/useImportModal';
import { convertExcelSerialToISO, isExcelSerialDate } from '@/utils/dateConversion';

interface Props {
  state: ImportModalState;
  update: (patch: Partial<ImportModalState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4Upload({ state, update, onNext, onBack }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const isDateHeader = (header: string) => {
    const normalized = header.toLowerCase();
    return normalized.includes('data') || normalized.includes('date') || normalized.includes('created') || normalized.includes('updated') || normalized.includes('due');
  };

  const normalizeDateColumns = (headers: string[], rows: CSVRow[]) => {
    let conversions = 0;
    const normalizedRows = rows.map(row => {
      const next = { ...row };
      headers.forEach(header => {
        if (!isDateHeader(header)) return;
        const value = row[header];
        if (!isExcelSerialDate(value)) return;

        const iso = convertExcelSerialToISO(value);
        if (iso) {
          console.log(`[DateConversion] ${header}: ${value} → ${iso}`);
          next[header] = iso;
          conversions++;
        } else {
          console.warn(`[DateConversion] Falha ao converter ${header}:`, value);
          next[header] = '';
        }
      });
      return next;
    });

    return { normalizedRows, conversions };
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

    update({ loading: true, error: null });

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

      if (headers.length === 0) { toast.error('Arquivo vazio ou inválido'); update({ loading: false }); return; }
      if (rows.length > 1000) { toast.error('Máximo 1.000 linhas por importação.'); update({ loading: false }); return; }

      const suggested = suggestMapping(headers);
      const { normalizedRows, conversions } = normalizeDateColumns(headers, rows);
      update({
        file,
        fileName: file.name,
        csvHeaders: headers,
        csvRows: normalizedRows,
        mapping: suggested,
        loading: false,
        dateConversions: conversions,
      });
      console.log('[Step4Upload] Arquivo processado:', { headers: headers.length, rows: rows.length });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar arquivo');
      update({ loading: false });
    }
  }, [update]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const crmFields = getCRMFields();
  const hasMappedName = Object.values(state.mapping).includes('name');
  const hasMappedContact = Object.values(state.mapping).includes('email') || Object.values(state.mapping).includes('phone');
  const canProceed = state.csvRows.length > 0 && hasMappedName && hasMappedContact;

  return (
    <div className="space-y-4 py-2">
      <h3 className="text-lg font-display text-foreground text-center">Upload e Mapeamento</h3>

      {/* Upload area */}
      {state.csvRows.length === 0 ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('import-file-input')?.click()}
        >
          {state.loading ? (
            <div className="space-y-2">
              <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Arraste seu arquivo aqui</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, XLSX ou XLS (máx 10MB, 1.000 linhas)</p>
            </>
          )}
          <input id="import-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      ) : (
        <>
          {/* File info */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">{state.fileName}</span>
              <Badge variant="secondary">{state.csvRows.length} linhas</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => update({ file: null, fileName: '', csvHeaders: [], csvRows: [], mapping: {}, dateConversions: 0 })}>
              <X className="h-4 w-4 mr-1" /> Trocar
            </Button>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">Primeiras 5 linhas</div>
            <div className="overflow-x-auto">
              <table className="text-[11px] w-full">
                <thead>
                  <tr className="bg-primary/10">
                    {state.csvHeaders.map(h => <th key={h} className="px-2 py-1 text-left font-medium text-foreground whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {state.csvRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border/50">
                      {state.csvHeaders.map(h => <td key={h} className="px-2 py-1 text-muted-foreground max-w-[120px] truncate">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapping */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Mapeamento de colunas</p>
            {!hasMappedName && <p className="text-xs text-destructive mb-1">⚠ Mapeie o campo "Nome" (obrigatório)</p>}
            {!hasMappedContact && <p className="text-xs text-destructive mb-1">⚠ Mapeie "Email" ou "Telefone" (obrigatório)</p>}
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
              {state.csvHeaders.map(header => (
                <div key={header} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{header}</span>
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Select
                    value={state.mapping[header] || '_ignore'}
                    onValueChange={v => update({ mapping: { ...state.mapping, [header]: v === '_ignore' ? '' : v } })}
                    key={`${header}-${state.mapping[header] || '_ignore'}`}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {crmFields.map(f => (
                        <SelectItem key={f.value || '_ignore'} value={f.value || '_ignore'}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!canProceed}>Validar e Importar</Button>
      </div>
    </div>
  );
}
