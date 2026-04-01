import { Badge, Button, Card, CardContent } from "@/components/ui/ds";
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { downloadTemplate, downloadTemplateXLSX, TEMPLATE_COLUMNS, templateExamples } from '@/services/templateService';
import { toast } from 'sonner';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Download({ onNext, onBack }: Props) {
  const handleDownloadXLSX = () => {
    downloadTemplateXLSX();
    toast.success('Modelo XLSX baixado!');
  };

  const handleDownloadCSV = () => {
    downloadTemplate();
    toast.success('Modelo CSV baixado!');
  };

  return (
    <div className="space-y-6 py-2">
      <h3 className="text-lg font-semibold text-neutral-700">Baixe o modelo</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-primary/30 bg-primary/5 cursor-pointer hover:shadow-md transition-shadow" onClick={handleDownloadXLSX}>
          <div>
            <FileSpreadsheet className="h-8 w-8 text-primary mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">XLSX</p>
              <Badge variant="secondary" className="text-[10px] mt-1">Recomendado</Badge>
            </div>
            <p className="text-xs text-neutral-500">Formato nativo do Excel</p>
            <Button size="sm" className="w-full mt-2">
              <Download className="h-3 w-3 mr-1" /> Baixar XLSX
            </Button>
          </div>
        </Card>

        <Card className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={handleDownloadCSV}>
          <div>
            <FileText className="h-8 w-8 text-neutral-500 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">CSV</p>
            </div>
            <p className="text-xs text-neutral-500">Texto separado por vírgula</p>
            <Button size="sm" variant="secondary" className="w-full mt-2">
              <Download className="h-3 w-3 mr-1" /> Baixar CSV
            </Button>
          </div>
        </Card>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-neutral-500">Preview do modelo (3 linhas de exemplo)</div>
        <div className="overflow-x-auto">
          <table className="text-[11px] w-full">
            <thead>
              <tr className="bg-primary/10">
                {TEMPLATE_COLUMNS.slice(0, 6).map(c => (
                  <th key={c.key} className="px-2 py-1.5 text-left text-foreground font-medium whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templateExamples.map((row, i) => (
                <tr key={i} className="border-t border-border/50">
                  {TEMPLATE_COLUMNS.slice(0, 6).map(c => (
                    <td key={c.key} className="px-2 py-1 text-neutral-500 whitespace-nowrap">{row[c.key as keyof typeof row]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext}>Próximo</Button>
      </div>
    </div>
  );
}
