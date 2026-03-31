import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '@/components/ui/ds';
import { Label } from '@/components/ui/ds';
import { Checkbox } from '@/components/ui/ds';
import { Badge } from '@/components/ui/ds';
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
          <DialogTitle className="font-display flex items-center gap-3">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar {type === 'leads' ? 'Leads' : 'Clientes'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format */}
          <div>
            <Label className="text-sm font-medium">Formato</Label>
            <div className="flex gap-3 mt-2">
              <Button variant="secondary" size="sm"
                onClick={() => setFormat('csv')}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  format === 'csv' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <FileSpreadsheet className={`h-5 w-5 ${format === 'csv' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">CSV</p>
                  <p className="text-xs text-muted-foreground">Excel</p>
                </div>
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => setFormat('pdf')}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  format === 'pdf' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <FileText className={`h-5 w-5 ${format === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">PDF</p>
                  <p className="text-xs text-muted-foreground">Relatório</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Data scope */}
          <div>
            <Label className="text-sm font-medium">Dados</Label>
            <div className="flex gap-3 mt-2">
              <Button variant="secondary" size="sm"
                onClick={() => setDataScope('all')}
                className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                  dataScope === 'all' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Todos ({allData.length})
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => setDataScope('filtered')}
                className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                  dataScope === 'filtered' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Filtrados ({filteredData.length})
              </Button>
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Colunas</Label>
              <Button variant="secondary" size="sm" onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selectedColumns.length === availableColumns.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto border rounded-md p-2">
              {availableColumns.map(col => (
                <div key={col.value} className="flex items-center gap-3">
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
          < variant="neutral" onClick={() => onOpenChange(false)}>Cancelar</>
          < onClick={handleExport} disabled={selectedColumns.length === 0 || loading}>
            {loading ? 'Exportando...' : `Exportar ${format.toUpperCase()}`}
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
