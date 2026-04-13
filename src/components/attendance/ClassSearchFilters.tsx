import { useState, useEffect } from 'react';
import { Input, Select, Button } from '@/components/ui/ds';
import { Search, X } from 'lucide-react';

interface ClassSearchFiltersProps {
  products: Array<{ id: string; name: string }>;
  onFilterChange: (filters: {
    productId?: string;
    searchTerm?: string;
    dateStart?: string;
    dateEnd?: string;
  }) => void;
}

export const ClassSearchFilters = ({
  products,
  onFilterChange,
}: ClassSearchFiltersProps) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  console.log('[ClassSearchFilters] Estado atual:', {
    selectedProduct,
    searchTerm,
    dateStart,
    dateEnd,
  });

  const handleProductChange = (productId: string) => {
    console.log('[ClassSearchFilters] Produto selecionado:', productId);
    setSelectedProduct(productId);
    onFilterChange({
      productId: productId || undefined,
      searchTerm,
      dateStart,
      dateEnd,
    });
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    onFilterChange({
      productId: selectedProduct || undefined,
      searchTerm: term,
      dateStart,
      dateEnd,
    });
  };

  const handleDateStartChange = (date: string) => {
    setDateStart(date);
    onFilterChange({
      productId: selectedProduct || undefined,
      searchTerm: term,
      dateStart: date,
      dateEnd,
    });
  };

  const handleDateEndChange = (date: string) => {
    setDateEnd(date);
    onFilterChange({
      productId: selectedProduct || undefined,
      searchTerm: term,
      dateStart,
      dateEnd: date,
    });
  };

  const handleClear = () => {
    console.log('[ClassSearchFilters] Limpando filtros');
    setSelectedProduct('');
    setSearchTerm('');
    setDateStart('');
    setDateEnd('');
    onFilterChange({});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro por Produto */}
        <Select
          label="Produto"
          options={[
            { value: '', label: '📊 Todos' },
            ...products.map(p => ({ value: p.id, label: p.name }))
          ]}
          value={selectedProduct}
          onChange={(e) => handleProductChange(e.target.value)}
          placeholder="Selecione..."
        />

        {/* Busca por Descrição */}
        <Input
          label="Buscar Aula"
          placeholder="Digite a descrição..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        {/* Data Início */}
        <Input
          label="Data Início"
          type="date"
          value={dateStart}
          onChange={(e) => handleDateStartChange(e.target.value)}
        />

        {/* Data Fim */}
        <Input
          label="Data Fim"
          type="date"
          value={dateEnd}
          onChange={(e) => handleDateEndChange(e.target.value)}
        />
      </div>

      {/* Botão Limpar Filtros */}
      {(selectedProduct || searchTerm || dateStart || dateEnd) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClear}
          icon={<X className="w-4 h-4" />}
        >
          Limpar Filtros
        </Button>
      )}

      {/* Indicador de Filtro Ativo */}
      {selectedProduct && (
        <div className="text-xs text-primary-600 font-medium">
          ✓ Produto selecionado: {products.find(p => p.id === selectedProduct)?.name}
        </div>
      )}
    </div>
  );
};