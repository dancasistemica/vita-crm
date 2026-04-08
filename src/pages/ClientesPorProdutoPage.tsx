import React, { useState, useEffect, useContext } from 'react';
import { 
  fetchClientsByProduct, 
  fetchProductsForOrganization,
  getProductMetrics
} from '@/services/clientProductService';
import { ClientsFilterBar, FilterState } from '@/components/clients/ClientsFilterBar';
import { ClientsByProductTable } from '@/components/clients/ClientsByProductTable';
import { CONSOLIDATED_ORG_ID } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Package, 
  TrendingUp, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Assuming there's a hook or context to get the current organization
// If not, we can use a temporary way to get it from auth
import { useOrganizationSwitch } from '@/hooks/useOrganizationSwitch';

export default function ClientesPorProdutoPage() {
  const { currentOrgId } = useOrganizationSwitch();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (currentOrgId) {
      loadProducts();
    }
  }, [currentOrgId]);

  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId, selectedProductId, filters]);

  const loadProducts = async () => {
    try {
      const data = await fetchProductsForOrganization(currentOrgId!);
      setProducts(data);
    } catch (error) {
      console.error('[ClientesPorProdutoPage] Erro ao carregar produtos:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchClientsByProduct(
        currentOrgId!,
        selectedProductId || undefined,
        filters
      );
      setClients(data);

      if (selectedProductId) {
        const productMetrics = await getProductMetrics(currentOrgId!, selectedProductId);
        setMetrics(productMetrics);
      } else {
        setMetrics(null);
      }
    } catch (error) {
      console.error('[ClientesPorProdutoPage] Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clientes por Produto</h1>
          <p className="text-neutral-500">Gerencie seus clientes e acompanhe o engajamento por produto.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Métricas do Produto Selecionado */}
      {selectedProductId && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3 text-neutral-500 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Total de Alunos</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">{metrics.total}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Alunos Ativos</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">{metrics.active}</div>
            <div className="text-xs text-neutral-500 mt-1">{metrics.activePercentage}% do total</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Inativos / Churn</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">{metrics.inactive}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3 text-primary-600 mb-2">
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Produto</span>
            </div>
            <div className="text-lg font-bold text-neutral-900 truncate">
              {products.find(p => p.id === selectedProductId)?.name || 'Selecionado'}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <ClientsFilterBar 
        products={products}
        selectedProduct={selectedProductId}
        onProductChange={setSelectedProductId}
        onFilterChange={setFilters}
      />

      {/* Tabela */}
      <ClientsByProductTable 
        clients={clients} 
        onRefresh={loadData}
        isLoading={isLoading}
      />
    </div>
  );
}
