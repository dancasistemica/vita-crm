import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface ClientsFilterBarProps {
  products: Array<{ id: string; name: string }>;
  onFilterChange: (filters: FilterState) => void;
  selectedProduct: string | null;
  onProductChange: (productId: string) => void;
}

export interface FilterState {
  paymentStatus?: string;
  engagementLevel?: string;
  riskOfChurn?: boolean;
  searchTerm?: string;
}

export function ClientsFilterBar({
  products,
  onFilterChange,
  selectedProduct,
  onProductChange,
}: ClientsFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (newFilters: FilterState) => {
    console.log('[ClientsFilterBar] Alterando filtros:', newFilters);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    console.log('[ClientsFilterBar] Limpando filtros');
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border border-neutral-200">
      {/* Linha 1: Produto + Busca */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Produto
          </label>
          <select
            value={selectedProduct || ''}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Todos os produtos --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Buscar cliente
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Nome ou email..."
              value={filters.searchTerm || ''}
              onChange={(e) =>
                handleFilterChange({ ...filters, searchTerm: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showAdvanced ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
          </button>
        </div>
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status Pagamento
            </label>
            <select
              value={filters.paymentStatus || ''}
              onChange={(e) => handleFilterChange({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="PENDENTE">Pendente</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nível de Engajamento
            </label>
            <select
              value={filters.engagementLevel || ''}
              onChange={(e) => handleFilterChange({ ...filters, engagementLevel: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="ALTO">Alto</option>
              <option value="MÉDIO">Médio</option>
              <option value="BAIXO">Baixo</option>
            </select>
          </div>

          <div className="flex items-end justify-between">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={filters.riskOfChurn || false}
                onChange={(e) => handleFilterChange({ ...filters, riskOfChurn: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">Risco de Churn</span>
            </label>

            <button
              onClick={clearFilters}
              className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
