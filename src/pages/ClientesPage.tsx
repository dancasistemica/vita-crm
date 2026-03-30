import { useState, useEffect } from 'react';
import { Plus, Filter, X, FileDown, Pencil, Trash2, PanelLeftClose, PanelLeftOpen, RotateCcw, ChevronUp, ChevronDown, ArrowLeft, Package, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSale, getClientSales } from '@/services/saleService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
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
import { CreateSubscriptionModal } from '@/components/sales/CreateSubscriptionModal';

export default function ClientesPage() {
  const hook = useClientsFilter();
  const { organization } = useOrganization();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleLeadId, setSaleLeadId] = useState<string | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientSales, setClientSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem('clientesPageShowFilters');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('clientesPageShowFilters', JSON.stringify(showFilters));
  }, [showFilters]);

  const loadClientSales = async (clientId: string) => {
    if (!organization?.id) return;

    try {
      setLoadingSales(true);
      console.log('[ClientesPage] Carregando vendas do cliente:', clientId);

      const sales = await getClientSales(organization.id, clientId);

      console.log('[ClientesPage] ✅ Vendas carregadas:', sales.length);
      setClientSales(sales);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar vendas';
      console.error('[ClientesPage] ❌ Erro ao carregar vendas:', errorMessage);
      toast.error(errorMessage);
      setClientSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleSelectClient = async (client: any) => {
    console.log('[ClientesPage] Cliente selecionado:', client.id);
    setSelectedClient(client);
    
    // Carregar vendas do cliente
    await loadClientSales(client.id);
  };

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
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-semibold">Filtros</SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { hook.resetFilters(); }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Limpar
                  </Button>
                </div>
              </SheetHeader>
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
          <Button
            variant="outline"
            size="sm"
            className="hidden lg:flex"
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? 'Esconder filtros' : 'Mostrar filtros'}
          >
            {showFilters ? <PanelLeftClose className="h-4 w-4 mr-1" /> : <PanelLeftOpen className="h-4 w-4 mr-1" />}
            {showFilters ? 'Esconder Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowSubscriptionModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Mensalidade
          </Button>
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
        {showFilters && !selectedClient && (
          <aside className="hidden lg:block w-[320px] shrink-0 transition-all duration-300">
            <div className="sticky top-4 rounded-xl border border-border/60 bg-card p-4 max-h-[calc(100vh-160px)] overflow-y-auto shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hook.resetFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Limpar
                </Button>
              </div>
              {filterPanel}
            </div>
          </aside>
        )}

        {/* Table or Details */}
        <div className="flex-1 min-w-0">
          {selectedClient ? (
            <div className="space-y-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedClient(null)} 
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para a lista
              </Button>
              
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Informações do Cliente */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Informações do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{selectedClient.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-semibold text-gray-900">{selectedClient.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Origem</p>
                      <p className="font-semibold text-gray-900">{selectedClient.origin || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Vendas do Cliente */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Vendas e Mensalidades</h3>
                  
                  {loadingSales ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : clientSales.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Nenhuma venda registrada para este cliente.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${sale.sale_type === 'unica' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {sale.sale_type === 'unica' ? <Package className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-bold text-gray-900">{sale.stage_name}</h4>
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${sale.sale_type === 'unica' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                    {sale.sale_type === 'unica' ? 'Venda Única' : 'Mensalidade'}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    sale.status.toLowerCase().includes('pago') || sale.status.toLowerCase().includes('ativ') ? 'bg-green-100 text-green-700' : 
                                    sale.status.toLowerCase().includes('pendent') ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {sale.status}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>{sale.payment_method_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{format(new Date(sale.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-extrabold text-gray-900">
                                {sale.stage_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                {sale.sale_type === 'mensalidade' && <span className="text-xs font-normal text-gray-400 ml-1">/mês</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
          )}
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
