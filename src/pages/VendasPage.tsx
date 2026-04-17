import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Card, Button, Alert, Input } from '@/components/ui/ds';
import { Plus, Filter, Search, Loader2 } from 'lucide-react';
import { loadAllSales } from '@/services/salesService';
import { SalesTable } from '@/components/sales/SalesTable';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';
import { SalesEditModal } from '@/components/sales/SalesEditModal';
import { SalesFilters } from '@/components/sales/SalesFilters';
import { deleteSale } from '@/services/saleService';

export function VendasPage() {
  const { organizationId, organization } = useOrganization();
  const [vendas, setVendas] = useState<any[]>([]);
  const [allVendas, setAllVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  
  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  console.log('[VendasPage] 🔍 Organization ID:', organizationId);
  console.log('[VendasPage] Organization ID disponível?', !!organizationId);

  if (!organizationId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-6">
        <h1 className="text-xl font-bold text-red-900">❌ Erro</h1>
        <p className="text-red-700">Organization ID não disponível. Verifique se você está logado.</p>
      </div>
    );
  }


  useEffect(() => {
    if (organizationId) {
      loadVendas();
    }
  }, [organizationId]);

  const loadVendas = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('[VendasPage] 📊 INICIANDO loadVendas');
      console.log('═══════════════════════════════════════════════════════');
      console.log('[VendasPage] Organization ID:', organizationId);
      console.log('[VendasPage] Timestamp:', new Date().toISOString());
      console.log('');

      // Usar a nova função que busca AMBAS as tabelas
      const allSales = await loadAllSales(organizationId);

      console.log('[VendasPage] ✅ Vendas carregadas:', allSales.length);
      if (allSales.length > 0) {
        console.log('[VendasPage] Primeiros 3 itens:', JSON.stringify(allSales.slice(0, 3), null, 2));
      } else {
        console.log('[VendasPage] ⚠️ Nenhuma venda retornada pelo banco');
      }

      setVendas(allSales);
      setAllVendas(allSales);

      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('[VendasPage] ✅ loadVendas finalizado com sucesso');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');

    } catch (error) {
      console.error('[VendasPage] ❌ ERRO ao carregar vendas:', error);
      setError('Erro ao carregar vendas');
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (sale: any) => {
    if (!confirm(`Tem certeza que deseja excluir esta venda de ${sale.client_name}?`)) return;

    try {
      await deleteSale(sale.id, sale.sale_type);
      toast.success('Venda excluída com sucesso');
      loadVendas();
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setTypeFilter('todos');
    setVendas(allVendas);
  };

  // Filtragem local
  const filteredSales = vendas.filter(sale => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (sale.client_name || '').toLowerCase().includes(searchLower) ||
      (sale.client_email || '').toLowerCase().includes(searchLower) ||
      (sale.stage_name || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'todos' || sale.status === statusFilter;
    const matchesType = typeFilter === 'todos' || sale.sale_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Vendas</h1>
          <p className="text-sm text-neutral-600 mt-1">Gerencie suas transações e vendas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="secondary"
            icon={<Filter className="w-5 h-5" />}
            onClick={() => {
              console.log('[VendasPage] Botão "Mais Filtros" clicado');
              setShowFilters(!showFilters);
            }}
            className="w-full sm:w-auto"
          >
            {showFilters ? 'Esconder Filtros' : 'Mais Filtros'} {showFilters ? '▲' : '▼'}
          </Button>
          <Button 
            variant="primary" 
            icon={<Plus className="w-5 h-5" />}
            onClick={() => {
              console.log('[VendasPage] 📋 Abrindo modal de nova venda');
              console.log('[VendasPage] organizationId:', organizationId);
              setShowCreateModal(true);
            }}
            className="w-full sm:w-auto"
            disabled={organization?.id === 'consolidado'}
            title={organization?.id === 'consolidado' ? "Selecione uma organização específica para criar vendas" : ""}
          >
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Painel de Filtros (Expandível) */}
      {showFilters && (
        <SalesFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={(val) => {
            setTypeFilter(val);
            if (val === 'todos') setVendas(allVendas);
            else if (val === 'unica') setVendas(allVendas.filter(v => !v.is_subscription));
            else if (val === 'mensalidade') setVendas(allVendas.filter(v => v.is_subscription));
          }}
          onClear={handleClearFilters}
        />
      )}

      {/* Busca Rápida e Filtro de Tipo (Sempre visíveis se filtros recolhidos) */}
      {!showFilters && (
        <div className="flex flex-col md:flex-row gap-4">
          <Card variant="elevated" padding="md" className="border-neutral-200 flex-1">
            <div className="max-w-md">
              <Input
                placeholder="Busca rápida por cliente ou etapa..."
                icon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card>
          
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const filterType = e.target.value;
                setTypeFilter(filterType);
                if (filterType === 'all' || filterType === 'todos') {
                  setVendas(allVendas);
                } else if (filterType === 'unica') {
                  setVendas(allVendas.filter(v => !v.is_subscription));
                } else if (filterType === 'mensalidade') {
                  setVendas(allVendas.filter(v => v.is_subscription));
                }
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:border-slate-400 transition-colors h-full min-w-[200px]"
              value={typeFilter}
            >
              <option value="all">📊 Todas as vendas</option>
              <option value="unica">🛒 Apenas vendas únicas</option>
              <option value="mensalidade">💳 Apenas mensalidades</option>
            </select>
          </div>
        </div>
      )}

      {/* Status */}
      <Card variant="elevated" padding="md" className="bg-neutral-50/50 border-neutral-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Total encontrado: <strong className="text-neutral-900">{filteredSales.length}</strong> {filteredSales.length === 1 ? 'venda' : 'vendas'}
          </p>
          <p className="text-sm text-neutral-600">
            Total geral: <strong className="text-neutral-900">{vendas.length}</strong>
          </p>
        </div>
      </Card>

      {/* Tabela de Vendas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-neutral-100 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="mt-4 text-neutral-600">Carregando dados das vendas...</p>
        </div>
      ) : filteredSales.length > 0 ? (
        <Card variant="elevated" padding="none" className="overflow-hidden border-neutral-200">
          <SalesTable 
            sales={filteredSales} 
            onEdit={handleEditSale} 
            onDelete={handleDeleteSale} 
          />
        </Card>
      ) : (
        <Alert variant="info" title="Nenhuma venda encontrada">
          <div className="space-y-2">
            <p>Não encontramos nenhuma venda com os filtros atuais ou você ainda não registrou vendas.</p>
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(true)}>
              + Criar Primeira Venda
            </Button>
          </div>
        </Alert>
      )}

      {/* Modais */}
      <CreateSaleModal 
        isOpen={showCreateModal} 
        onClose={() => {
          console.log('[VendasPage] ❌ Fechando modal de venda');
          setShowCreateModal(false);
        }} 
        onSuccess={loadVendas}
        organizationId={organizationId}
      />
      
      {showEditModal && selectedSale && (
        <SalesEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
          onSuccess={loadVendas}
        />
      )}
    </div>
  );
}

export default VendasPage;