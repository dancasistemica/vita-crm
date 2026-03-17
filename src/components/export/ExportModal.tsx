import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToPDF, type ExportColumn } from '@/services/exportService';

const LEAD_COLUMNS: ExportColumn[] = [
  { value: 'name', label: 'Nome' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'city', label: 'Cidade' },
  { value: 'entryDate', label: 'Data Entrada' },
  { value: 'origin', label: 'Origem' },
  { value: 'interestLevel', label: 'Nível Interesse' },
  { value: 'pipelineStage', label: 'Etapa Funil' },
  { value: 'mainInterest', label: 'Interesse Principal' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Observações' },
  { value: 'responsible', label: 'Responsável' },
];

const CLIENT_COLUMNS: ExportColumn[] = [
  { value: 'name', label: 'Nome' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'origin', label: 'Origem' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Observações' },
  { value: 'responsible', label: 'Responsável' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'leads' | 'clients';
  allData: Record<string, any>[];
  filteredData: Record<string, any>[];
}

export default function ExportModal({ open, onOpenChange, type, allData, filteredData }: Props) {
  const availableColumns = type === 'leads' ? LEAD_COLUMNS : CLIENT_COLUMNS;
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [dataScope, setDataScope] = useState<'all' | 'filtered'>('filtered');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns.map(c => c.value));
  const [loading, setLoading] = useState(false);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const toggleAll = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map(c => c.value));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Selecione ao menos uma coluna');
      return;
    }
    setLoading(true);
    try {
      const data = dataScope === 'all' ? allData : filteredData;
      const columns = availableColumns.filter(c => selectedColumns.includes(c.value));
      const options = { type, format, columns, data };

      if (format === 'csv') {
        exportToCSV(options);
      } else {
        exportToPDF(options);
      }
      toast.success(`${format.toUpperCase()} exportado com sucesso!`);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao exportar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar {type === 'leads' ? 'Leads' : 'Clientes'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Format */}
          <div>
            <Label className="text-sm font-medium">Formato</Label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  format === 'csv' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <FileSpreadsheet className={`h-5 w-5 ${format === 'csv' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">CSV</p>
                  <p className="text-xs text-muted-foreground">Excel</p>
                </div>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  format === 'pdf' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <FileText className={`h-5 w-5 ${format === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">PDF</p>
                  <p className="text-xs text-muted-foreground">Relatório</p>
                </div>
              </button>
            </div>
          </div>

          {/* Data scope */}
          <div>
            <Label className="text-sm font-medium">Dados</Label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setDataScope('all')}
                className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                  dataScope === 'all' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Todos ({allData.length})
              </button>
              <button
                onClick={() => setDataScope('filtered')}
                className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                  dataScope === 'filtered' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Filtrados ({filteredData.length})
              </button>
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Colunas</Label>
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selectedColumns.length === availableColumns.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
              {availableColumns.map(col => (
                <div key={col.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedColumns.includes(col.value)}
                    onCheckedChange={() => toggleColumn(col.value)}
                  />
                  <span className="text-sm text-foreground">{col.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selectedColumns.length} colunas selecionadas</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0 || loading}>
            {loading ? 'Exportando...' : `Exportar ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
