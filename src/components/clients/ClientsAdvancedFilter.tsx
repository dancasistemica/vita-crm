import { useState } from 'react';
import { Search, X, RotateCcw, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ClientsFilterState } from '@/hooks/useClientsFilter';
interface SimpleProduct {
  id: string;
  name: string;
}

interface Props {
  filters: ClientsFilterState;
  updateFilter: <K extends keyof ClientsFilterState>(key: K, value: ClientsFilterState[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  products: SimpleProduct[];
  origins: string[];
  users: { id: string; name: string }[];
  saleStatuses: string[];
}

function LogicToggle({ value, onChange }: { value: 'AND' | 'OR'; onChange: (v: 'AND' | 'OR') => void }) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
      <button
        className={`rounded px-2 py-0.5 transition-colors ${value === 'AND' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChange('AND')}
      >E</button>
      <button
        className={`rounded px-2 py-0.5 transition-colors ${value === 'OR' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChange('OR')}
      >OU</button>
    </div>
  );
}

function FilterSection({ title, count, children, defaultOpen = false }: { title: string; count: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border pb-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {title}
        </div>
        {count > 0 && <Badge variant="destructive" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">{count}</Badge>}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ClientsAdvancedFilter({ filters, updateFilter, resetFilters, activeFilterCount, products, origins, users, saleStatuses }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground text-sm">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{activeFilterCount} ativos</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs text-muted-foreground">
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente por nome..."
          value={filters.search}
          onChange={e => updateFilter('search', e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {filters.search && (
          <button onClick={() => updateFilter('search', '')} className="absolute right-2.5 top-2.5">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Scrollable filters */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {/* 1. Produto */}
        <FilterSection title="Produto Comprado" count={filters.products.ids.length}>
          <div className="flex justify-end mb-1">
            <LogicToggle value={filters.products.logic} onChange={v => updateFilter('products', { ...filters.products, logic: v })} />
          </div>
          {products.map(p => (
            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
              <Checkbox
                checked={filters.products.ids.includes(p.id)}
                onCheckedChange={checked => {
                  const ids = checked ? [...filters.products.ids, p.id] : filters.products.ids.filter(x => x !== p.id);
                  updateFilter('products', { ...filters.products, ids });
                }}
              />
              <span className="truncate text-foreground">{p.name}</span>
            </label>
          ))}
        </FilterSection>

        {/* 2. Valor */}
        <FilterSection title="Valor de Venda" count={filters.valueRange.min > 0 || filters.valueRange.max < 10000 ? 1 : 0}>
          <div className="px-1">
            <Slider
              min={0} max={10000} step={50}
              value={[filters.valueRange.min, filters.valueRange.max]}
              onValueChange={([min, max]) => updateFilter('valueRange', { min, max })}
              className="mb-3"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">De (R$)</Label>
                <Input type="number" value={filters.valueRange.min} onChange={e => updateFilter('valueRange', { ...filters.valueRange, min: Number(e.target.value) })} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Até (R$)</Label>
                <Input type="number" value={filters.valueRange.max} onChange={e => updateFilter('valueRange', { ...filters.valueRange, max: Number(e.target.value) })} className="h-8 text-xs" />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* 3. Data de compra */}
        <FilterSection title="Data de Compra" count={filters.dateRange.from || filters.dateRange.to ? 1 : 0}>
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { label: '7 dias', days: 7 },
              { label: '30 dias', days: 30 },
              { label: '90 dias', days: 90 },
              { label: 'Este ano', days: -1 },
            ].map(({ label, days }) => (
              <Button key={label} variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                const now = new Date();
                const to = now.toISOString().split('T')[0];
                const from = days === -1
                  ? `${now.getFullYear()}-01-01`
                  : new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
                updateFilter('dateRange', { from, to });
              }}>
                {label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input type="date" value={filters.dateRange.from} onChange={e => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input type="date" value={filters.dateRange.to} onChange={e => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
        </FilterSection>

        {/* 4. Status de venda */}
        <FilterSection title="Status de Venda" count={filters.saleStatuses.values.length}>
          <div className="flex justify-end mb-1">
            <LogicToggle value={filters.saleStatuses.logic} onChange={v => updateFilter('saleStatuses', { ...filters.saleStatuses, logic: v })} />
          </div>
          {saleStatuses.map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer py-0.5 capitalize">
              <Checkbox
                checked={filters.saleStatuses.values.includes(s)}
                onCheckedChange={checked => {
                  const values = checked ? [...filters.saleStatuses.values, s] : filters.saleStatuses.values.filter(x => x !== s);
                  updateFilter('saleStatuses', { ...filters.saleStatuses, values });
                }}
              />
              <span className="text-foreground">{s}</span>
            </label>
          ))}
        </FilterSection>

        {/* 5. Origem */}
        <FilterSection title="Origem do Cliente" count={filters.origins.values.length}>
          <div className="flex justify-end mb-1">
            <LogicToggle value={filters.origins.logic} onChange={v => updateFilter('origins', { ...filters.origins, logic: v })} />
          </div>
          {origins.map(o => (
            <label key={o} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
              <Checkbox
                checked={filters.origins.values.includes(o)}
                onCheckedChange={checked => {
                  const values = checked ? [...filters.origins.values, o] : filters.origins.values.filter(x => x !== o);
                  updateFilter('origins', { ...filters.origins, values });
                }}
              />
              <span className="truncate text-foreground">{o}</span>
            </label>
          ))}
        </FilterSection>

        {/* 6. Responsável */}
        <FilterSection title="Responsável" count={filters.responsibles.ids.length}>
          <div className="flex justify-end mb-1">
            <LogicToggle value={filters.responsibles.logic} onChange={v => updateFilter('responsibles', { ...filters.responsibles, logic: v })} />
          </div>
          {users.map(u => (
            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
              <Checkbox
                checked={filters.responsibles.ids.includes(u.name)}
                onCheckedChange={checked => {
                  const ids = checked ? [...filters.responsibles.ids, u.name] : filters.responsibles.ids.filter(x => x !== u.name);
                  updateFilter('responsibles', { ...filters.responsibles, ids });
                }}
              />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
                  {u.name.charAt(0)}
                </div>
                <span className="text-foreground">{u.name}</span>
              </div>
            </label>
          ))}
        </FilterSection>

        {/* 7. Última interação */}
        <FilterSection title="Última Interação" count={filters.lastInteraction.preset || filters.lastInteraction.from ? 1 : 0}>
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { label: 'Últimos 7 dias', value: '7d' },
              { label: 'Últimos 30 dias', value: '30d' },
              { label: 'Sem interação 30+ dias', value: 'no_interaction_30' },
            ].map(({ label, value }) => (
              <Button
                key={value}
                variant={filters.lastInteraction.preset === value ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => updateFilter('lastInteraction', {
                  from: '', to: '',
                  preset: filters.lastInteraction.preset === value ? '' : value,
                })}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input type="date" value={filters.lastInteraction.from} onChange={e => updateFilter('lastInteraction', { ...filters.lastInteraction, from: e.target.value, preset: '' })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input type="date" value={filters.lastInteraction.to} onChange={e => updateFilter('lastInteraction', { ...filters.lastInteraction, to: e.target.value, preset: '' })} className="h-8 text-xs" />
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
