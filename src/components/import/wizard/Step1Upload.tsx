import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseCSVText, suggestMapping } from '@/services/importService';
import { parseFile, getFileType } from '@/services/excelParser';
import type { WizardState } from '@/hooks/useImportWizard';

interface Props {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}

export default function Step1Upload({ state, update }: Props) {
  const [dragOver, setDragOver] = useState(false);

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
      let rows: Record<string, string>[];

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

      if (headers.length === 0 || rows.length === 0) {
        toast.error('Arquivo vazio ou inválido');
        update({ loading: false });
        return;
      }
      if (rows.length > 1000) {
        toast.error('Máximo 1.000 linhas. Divida o arquivo.');
        update({ loading: false });
        return;
      }

      const mapping = suggestMapping(headers);
      update({ file, fileName: file.name, headers, rows, mapping, loading: false, error: null });
    } catch (err) {
      update({ loading: false, error: err instanceof Error ? err.message : 'Erro ao processar arquivo' });
      toast.error('Erro ao processar arquivo');
    }
  }, [update]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = () => {
    update({ file: null, fileName: '', headers: [], rows: [], mapping: {}, error: null });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display text-foreground">Upload do Arquivo</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione ou arraste o arquivo com seus leads</p>
      </div>

      {!state.file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
            dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('wizard-file-input')?.click()}
        >
          {state.loading ? (
            <div className="space-y-3">
              <RefreshCw className="h-10 w-10 text-primary mx-auto animate-spin" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-medium text-foreground">Arraste seu arquivo aqui</p>
              <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-4">CSV, XLSX, XLS · Máx 10MB · Máx 1.000 linhas</p>
            </>
          )}
          <input
            id="wizard-file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-success/30 bg-success/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{state.fileName}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{state.rows.length} linhas</Badge>
                <Badge variant="secondary" className="text-xs">{state.headers.length} colunas</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile}>Trocar</Button>
          </div>

          {/* Quick preview */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-primary/10">
                  {state.headers.slice(0, 5).map(h => (
                    <th key={h} className="px-3 py-2 text-left text-primary font-semibold whitespace-nowrap">{h}</th>
                  ))}
                  {state.headers.length > 5 && <th className="px-3 py-2 text-muted-foreground">+{state.headers.length - 5}</th>}
                </tr>
              </thead>
              <tbody>
                {state.rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-border/50">
                    {state.headers.slice(0, 5).map(h => (
                      <td key={h} className="px-3 py-1.5 text-foreground max-w-[140px] truncate">{row[h]}</td>
                    ))}
                    {state.headers.length > 5 && <td className="px-3 py-1.5 text-muted-foreground">…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}
    </div>
  );
}
