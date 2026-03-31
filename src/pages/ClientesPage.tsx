import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button, Card, Input, Badge, Alert } from '@/components/ui/ds';
import { Plus, Search, Filter, FileDown, Pencil, Trash2, ArrowLeft, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useClientsFilter } from '@/hooks/useClientsFilter';
import ClientsTable from '@/components/clients/ClientsTable';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';
import { CreateSubscriptionModal } from '@/components/sales/CreateSubscriptionModal';
import ExportModal from '@/components/export/ExportModal';
import BulkEditModal from '@/components/bulk/BulkEditModal';
import BulkDeleteModal from '@/components/bulk/BulkDeleteModal';
import NewSaleModal from '@/components/sales/NewSaleModal';

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
    // Note: Detail view should probably be a separate page or a more complex component
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Gestão de clientes e histórico de vendas
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="neutral" 
            size="md" 
            icon={<FileDown className="w-4 h-4" />}
            onClick={() => setExportOpen(true)}
          >
            Exportar
          </Button>
          <Button 
            variant="neutral" 
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

      {/* BULK ACTIONS */}
      {hook.selectedIds.length > 0 && (
        <Alert variant="info" title={`${hook.selectedIds.length} clientes selecionados`}>
          <div className="flex gap-3 mt-2">
            <Button variant="neutral" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => setBulkEditOpen(true)}>
              Editar em Massa
            </Button>
            <Button variant="error" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setBulkDeleteOpen(true)}>
              Deletar Selecionados
            </Button>
          </div>
        </Alert>
      )}

      {/* FILTER BAR */}
      <Card variant="default" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              icon={<Search className="w-4 h-4" />}
              value={hook.filters.search || ''}
              onChange={(e) => hook.updateFilter('search', e.target.value)}
            />
          </div>
          <Button 
            variant={showFilters ? 'primary' : 'secondary'} 
            size="md" 
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}
          </Button>
        </div>
      </Card>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 gap-6">
        <Card variant="elevated" padding="none">
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
        </Card>
      </div>

      {/* MODAIS */}
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
