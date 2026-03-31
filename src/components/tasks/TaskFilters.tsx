import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { TASK_TYPES } from "@/types/crm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OrgMember {
  user_id: string;
  profiles?: { full_name: string; email: string | null } | null;
}

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  assignedFilter: string;
  onAssignedChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onClear: () => void;
  orgMembers: OrgMember[];
}

export default function TaskFilters({
  searchTerm, onSearchChange,
  typeFilter, onTypeChange,
  assignedFilter, onAssignedChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  onClear,
  orgMembers,
}: TaskFiltersProps) {
  const [open, setOpen] = useState(false);
  const hasFilters = searchTerm || typeFilter !== 'all' || assignedFilter !== 'all' || dateFrom || dateTo;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </CollapsibleTrigger>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive gap-1">
            <X className="h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          <div>
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TASK_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <Select value={assignedFilter} onValueChange={onAssignedChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unassigned">Sem responsável</SelectItem>
                {orgMembers.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name || m.profiles?.email || m.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
