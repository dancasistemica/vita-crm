import { useState } from 'react';
import { Plus, Filter, X, FileDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import ClientsAdvancedFilter from '@/components/clients/ClientsAdvancedFilter';
import ClientsTable from '@/components/clients/ClientsTable';
import { FilterChip } from '@/components/clients/FilterChip';
import { useClientsFilter } from '@/hooks/useClientsFilter';
import ExportModal from '@/components/export/ExportModal';
import BulkEditModal from '@/components/bulk/BulkEditModal';
import BulkDeleteModal from '@/components/bulk/BulkDeleteModal';
import RecordCounter from '@/components/common/RecordCounter';
import NewSaleModal from '@/components/sales/NewSaleModal';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';

export default function ClientesPage() {
  const hook = useClientsFilter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleLeadId, setSaleLeadId] = useState<string | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleNewSale = (leadId?: string) => {
    setSaleLeadId(leadId);
    setSaleModalOpen(true);
  };

  const totalClientsCount = hook.totalFiltered;

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
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <FileDown className="h-4 w-4 mr-1" /> Exportar
          </Button>
          {hook.selectedIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar em massa ({hook.selectedIds.length})
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" /> Deletar ({hook.selectedIds.length})
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Venda
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

      {/* Record counter */}
      <RecordCounter
        totalCount={totalClientsCount}
        filteredCount={hook.totalFiltered}
        perPage={hook.perPage}
        onPerPageChange={hook.setPerPage}
      />

      {/* Layout: sidebar + table */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-4 rounded-xl border border-border/60 bg-card p-4 max-h-[calc(100vh-160px)] overflow-y-auto shadow-card">
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
            onNewSale={handleNewSale}
            loading={hook.loading}
            products={hook.products}
          />
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        type="clients"
        allData={hook.filteredClients}
        filteredData={hook.filteredClients}
      />
      <BulkDeleteModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedIds={hook.selectedIds}
        type="clients"
        onSuccess={() => {
          hook.selectedIds.forEach(id => hook.toggleSelect(id));
        }}
        items={hook.filteredClients.map((c: any) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone }))}
      />
      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={hook.selectedIds}
        type="clients"
        onSuccess={() => {
          hook.selectedIds.forEach(id => hook.toggleSelect(id));
        }}
      />
      <NewSaleModal
        open={saleModalOpen}
        onOpenChange={setSaleModalOpen}
        preSelectedLeadId={saleLeadId}
        onSaleCreated={() => hook.refetchData()}
      />
      <CreateSaleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => hook.refetchData()}
      />
    </div>
  );
}
