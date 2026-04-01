import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getSalesAndSubscriptions, deleteSale } from '@/services/saleService';
import { Button, Card, Input, Select, Badge, Alert } from '@/components/ui/ds';
import { Plus, Search, Filter, Edit2, Trash2, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';
import EditSaleModal from '@/components/sales/EditSaleModal';

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

      const allSales = await getSalesAndSubscriptions(organization.id);
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
    setSelectedSale(sale);
    setShowEditModal(true);
  };

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.stage_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || sale.status === statusFilter;
    const matchesType = typeFilter === 'todos' || sale.sale_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Vendas</h1>
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
      <Card variant="default" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por cliente ou etapa..."
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Etapa</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-neutral-900">{sale.client_name}</td>
                    <td className="py-3 px-4 text-neutral-900">{sale.stage_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={sale.sale_type === 'unica' ? 'default' : 'warning'} size="sm">
                        {sale.sale_type === 'unica' ? '💳 Única' : '📅 Mensalidade'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-900 font-semibold">
                      R$ {Number(sale.stage_value).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={sale.status === 'ativa' ? 'success' : 'error'} 
                        size="sm"
                      >
                        {sale.status === 'ativa' ? '✅ Ativa' : '❌ Cancelada'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Edit2 className="w-4 h-4" />} 
                          onClick={() => handleEditSale(sale)}
                        />
                        <Button 
                          variant="error" 
                          size="sm" 
                          icon={<Trash2 className="w-4 h-4" />} 
                          onClick={() => handleDeleteSale(sale)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modais */}
      <CreateSaleModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={loadSales}
      />
      
      {showEditModal && selectedSale && (
        <EditSaleModal
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
