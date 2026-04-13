import { Alert, Button, Card, Input, Select } from "@/components/ui/ds";
import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { deleteSale } from '@/services/saleService';
import { fetchSales } from '@/services/salesService';
import { Plus, Search, Filter, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';
import { SalesEditModal } from '@/components/sales/SalesEditModal';
import { SalesTable } from '@/components/sales/SalesTable';

export function VendasPage() {
  const { organization } = useOrganization();
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  useEffect(() => {
    loadSales();
  }, [organization?.id]);

  const loadSales = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      setError(null);
      console.log('[VendasPage] Carregando vendas para org:', organization.id);

      const allSales = await fetchSales(organization.id);
      console.log('[VendasPage] ✅ Vendas carregadas:', allSales.length);
      setSales(allSales);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar vendas';
      console.error('[VendasPage] ❌ Erro:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (sale: any) => {
    if (!confirm(`Tem certeza que deseja excluir esta venda de ${sale.client_name}?`)) return;

    try {
      await deleteSale(sale.id, sale.sale_type);
      toast.success('Venda excluída com sucesso');
      loadSales();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir venda';
      toast.error(errorMessage);
    }
  };

  const handleEditSale = (sale: any) => {
    console.log('[VendasPage] Abrindo edição para:', sale.id);
    setSelectedSale(sale);
    setShowEditModal(true);
  };

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      sale.client_name?.toLowerCase().includes(searchLower) ||
      sale.client_email?.toLowerCase().includes(searchLower) ||
      sale.stage_name?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'todos' || sale.status === statusFilter;
    const matchesType = typeFilter === 'todos' || sale.sale_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="px-2 py-4 sm:p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Vendas</h1>
          <p className="text-sm text-neutral-600 mt-1">
            {filteredSales.length} {filteredSales.length === 1 ? 'venda' : 'vendas'}
          </p>
        </div>
        <Button 
          variant="primary" 
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto"
        >
          Nova Venda
        </Button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <Alert variant="error" title="Erro ao carregar vendas">
          {error}
          <div className="mt-3">
            <Button variant="error" size="sm" onClick={loadSales}>
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      {/* FILTER BAR */}
      <Card variant="primary" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por cliente, email ou etapa..."
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            label="Status"
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'ativa', label: 'Ativa' },
              { value: 'cancelada', label: 'Cancelada' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            label="Tipo"
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'unica', label: 'Venda Única' },
              { value: 'mensalidade', label: 'Mensalidade' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <div className="flex items-end">
            <Button variant="secondary" size="md" className="w-full">
              <Filter className="w-4 h-4" />
              Mais Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* CONTENT AREA */}
      {loading ? (
        <Card variant="elevated" padding="lg" className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
            <p className="text-neutral-600">Carregando vendas...</p>
          </div>
        </Card>
      ) : filteredSales.length === 0 ? (
        <Card variant="elevated" padding="lg" className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-neutral-600 mb-4">Nenhuma venda encontrada</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + Criar Primeira Venda
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" padding="lg">
          <SalesTable 
            sales={filteredSales} 
            onEdit={handleEditSale} 
            onDelete={handleDeleteSale} 
          />
        </Card>
      )}

      {/* Modais */}
      <CreateSaleModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={loadSales}
      />
      
      {showEditModal && selectedSale && (
        <SalesEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
          onSuccess={loadSales}
        />
      )}
    </div>
  );
}

export default VendasPage;
