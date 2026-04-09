import React, { useState, useEffect } from 'react';
import { 
  fetchClientsByProduct, 
  fetchProductsForOrganization,
} from '@/services/clientProductService';
import { 
  getProductMetrics, 
  ProductMetrics 
} from '@/services/productMetricsService';
import { ClientsFilterBar, FilterState } from '@/components/clients/ClientsFilterBar';
import { ClientsByProductTable } from '@/components/clients/ClientsByProductTable';
import { ProductMetricsCard } from '@/components/products/ProductMetricsCard';
import { ProductMetricsCharts } from '@/components/products/ProductMetricsCharts';
import { 
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';

// Assuming there's a hook or context to get the current organization
// If not, we can use a temporary way to get it from auth
import { useOrganizationSwitch } from '@/hooks/useOrganizationSwitch';

export default function ClientesPorProdutoPage() {
  const { currentOrgId } = useOrganizationSwitch();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
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

      {/* Dashboard de Métricas */}
      {selectedProductId && metrics && (
        <div className="space-y-6 animate-in slide-in-from-top duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProductMetricsCard 
              productName={metrics.productName}
              totalClients={metrics.totalClients}
              activeClients={metrics.activeClients}
              activePercentage={metrics.activePercentage}
              attendanceRate={metrics.attendanceRate}
              churnRisk={metrics.churnRisk}
              averageEngagementLevel={metrics.averageEngagementLevel}
            />
            
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
               <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                 <LayoutDashboard className="w-8 h-8" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-neutral-900">Visão Geral do Produto</h3>
                 <p className="text-sm text-neutral-500 max-w-xs">
                   Acompanhe o desempenho de {metrics.productName} em tempo real com indicadores de retenção e engajamento.
                 </p>
               </div>
            </div>
          </div>

          <ProductMetricsCharts 
            weeklyData={metrics.weeklyData}
            engagementDistribution={metrics.engagementDistribution}
          />
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
