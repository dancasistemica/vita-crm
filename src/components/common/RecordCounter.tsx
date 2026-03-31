import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds';

interface RecordCounterProps {
  totalCount: number;
  filteredCount: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
}

export default function RecordCounter({ totalCount, filteredCount, perPage, onPerPageChange }: RecordCounterProps) {
  const isFiltered = filteredCount < totalCount;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-lg border border-border bg-card p-3">
      {/* Counter */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Total de registros</p>
          <p className="text-xl font-bold text-foreground">{filteredCount}</p>
          {isFiltered && (
            <p className="text-[10px] text-muted-foreground">de {totalCount} total</p>
          )}
        </div>
      </div>

      {/* Per page selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Exibir por página:</span>
        <Select value={String(perPage)} onValueChange={v => onPerPageChange(Number(v))}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="1000">1000</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
