import { useState } from 'react';
import { Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import ClientsAdvancedFilter from '@/components/clients/ClientsAdvancedFilter';
import ClientsTable from '@/components/clients/ClientsTable';
import { FilterChip } from '@/components/clients/FilterChip';
import { useClientsFilter } from '@/hooks/useClientsFilter';

export default function ClientesPage() {
  const hook = useClientsFilter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filterPanel = (
    <ClientsAdvancedFilter
      filters={hook.filters}
      updateFilter={hook.updateFilter}
      resetFilters={hook.resetFilters}
      activeFilterCount={hook.activeFilterCount}
      products={hook.products}
      origins={hook.origins}
      users={hook.users}
      saleStatuses={hook.saleStatuses}
    />
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestão de clientes e histórico de vendas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter trigger */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden relative">
                <Filter className="h-4 w-4 mr-1" /> Filtros
                {hook.activeFilterCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                    {hook.activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-4 overflow-y-auto">
              <SheetHeader className="sr-only"><SheetTitle>Filtros</SheetTitle></SheetHeader>
              {filterPanel}
            </SheetContent>
          </Sheet>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      {hook.getActiveFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hook.getActiveFilterChips.map(chip => (
            <FilterChip key={chip.key} label={chip.label} onRemove={() => hook.removeFilterChip(chip.key)} />
          ))}
          <button onClick={hook.resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
            Limpar todos
          </button>
        </div>
      )}

      {/* Layout: sidebar + table */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-4 rounded-lg border border-border bg-card p-4 max-h-[calc(100vh-160px)] overflow-y-auto">
            {filterPanel}
          </div>
        </aside>

        {/* Table */}
        <div className="flex-1 min-w-0">
          <ClientsTable
            clients={hook.filteredClients}
            getClientSales={hook.getClientSales}
            getLastInteraction={hook.getLastInteraction}
            sortField={hook.sortField}
            sortDir={hook.sortDir}
            toggleSort={hook.toggleSort}
            selectedIds={hook.selectedIds}
            toggleSelect={hook.toggleSelect}
            toggleSelectAll={hook.toggleSelectAll}
            page={hook.page}
            setPage={hook.setPage}
            perPage={hook.perPage}
            setPerPage={hook.setPerPage}
            totalPages={hook.totalPages}
            totalFiltered={hook.totalFiltered}
          />
        </div>
      </div>
    </div>
  );
}
