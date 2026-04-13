import React from 'react';
import { Card, Input, Select, Button } from "@/components/ui/ds";
import { Search, X } from 'lucide-react';

interface SalesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  onClear: () => void;
}

export const SalesFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onClear
}: SalesFiltersProps) => {
  return (
    <Card variant="elevated" padding="lg" className="space-y-4 bg-neutral-50 border-neutral-200">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Filtros Avançados</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-neutral-500 hover:text-neutral-700">
          <X className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Buscar</label>
          <Input
            placeholder="Cliente, email ou etapa..."
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Status</label>
          <Select
            options={[
              { value: 'todos', label: 'Todos os Status' },
              { value: 'ativa', label: 'Ativa' },
              { value: 'cancelada', label: 'Cancelada' },
              { value: 'pendente', label: 'Pendente' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Tipo de Venda</label>
          <Select
            options={[
              { value: 'todos', label: 'Todos os Tipos' },
              { value: 'unica', label: 'Venda Única' },
              { value: 'mensalidade', label: 'Mensalidade' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
};
