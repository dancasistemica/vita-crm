import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Info } from 'lucide-react';
import type { WizardState } from '@/hooks/useImportWizard';

interface Props {
  state: WizardState;
}

export default function Step2Preview({ state }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display text-foreground">Preview dos Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">Confira se os dados foram lidos corretamente</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {state.rows.length} linhas
        </Badge>
        <Badge variant="secondary" className="gap-1.5">
          {state.headers.length} colunas
        </Badge>
        <Badge variant="secondary" className="gap-1.5 bg-success/10 text-success border-success/20">
          UTF-8 ✓
        </Badge>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/10">
                <TableHead className="text-primary font-semibold w-12">#</TableHead>
                {state.headers.map(h => (
                  <TableHead key={h} className="text-primary font-semibold whitespace-nowrap">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.rows.slice(0, 5).map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                  {state.headers.map(h => (
                    <TableCell key={h} className="whitespace-nowrap text-sm max-w-[200px] truncate">{row[h]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {state.rows.length > 5 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Mostrando 5 de {state.rows.length} linhas
        </div>
      )}
    </div>
  );
}
