import { Alert, Badge, Button, Card, Input } from "@/components/ui/ds";
import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Plus, Search, Filter, FileDown, Pencil, Trash2 } from 'lucide-react';
import { useClientsFilter, SortField } from '@/hooks/useClientsFilter';
import ClientsTable from '@/components/clients/ClientsTable';
import ClientsAdvancedFilter from '@/components/clients/ClientsAdvancedFilter';
import { FilterChip } from '@/components/clients/FilterChip';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';
import { CreateSubscriptionModal } from '@/components/sales/CreateSubscriptionModal';
import ExportModal from '@/components/export/ExportModal';
import BulkEditModal from '@/components/bulk/BulkEditModal';
import BulkDeleteModal from '@/components/bulk/BulkDeleteModal';
import NewSaleModal from '@/components/sales/NewSaleModal';
import RecordCounter from "@/components/common/RecordCounter";

export default function ClientesPage() {
  const hook = useClientsFilter();
  const { organization } = useOrganization();
  
  const [showFilters, setShowFilters] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleLeadId, setSaleLeadId] = useState<string | undefined>();
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const handleNewSale = (leadId?: string) => {
    setSaleLeadId(leadId);
    setSaleModalOpen(true);
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Clientes</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Gestão de clientes e histórico de vendas
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="secondary" 
            size="md" 
            icon={<FileDown className="w-4 h-4" />}
            onClick={() => setExportOpen(true)}
          >
            Exportar
          </Button>
          <Button 
            variant="secondary" 
            size="md" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowSubscriptionModal(true)}
          >
            Nova Mensalidade
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nova Venda
          </Button>
        </div>
      </div>

      {hook.selectedIds.length > 0 && (
        <Alert variant="info" title={`${hook.selectedIds.length} clientes selecionados`}>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => setBulkEditOpen(true)}>
              Editar em Massa
            </Button>
            <Button variant="error" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setBulkDeleteOpen(true)}>
              Deletar Selecionados
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filtros Avançados</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={hook.resetFilters}
                icon={<Filter className="w-4 h-4" />}
                className="h-8 w-8 p-0"
                title="Limpar filtros"
              />
            </div>
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
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-wrap gap-2">
            {hook.getActiveFilterChips.map(chip => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                onRemove={() => hook.removeFilterChip(chip.key)}
              />
            ))}
            {hook.activeFilterCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={hook.resetFilters}
                className="text-xs h-7"
              >
                Limpar todos
              </Button>
            )}
          </div>

          <RecordCounter
            totalCount={hook.totalCount}
            filteredCount={hook.totalFiltered}
            perPage={hook.perPage}
            onPerPageChange={hook.setPerPage}
          />

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
            onSelectClient={handleSelectClient}
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
      <CreateSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => hook.refetchData()}
      />
    </div>
  );
}
