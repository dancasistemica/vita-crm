import { useState } from 'react';
import { Input, Select, Button } from '@/components/ui/ds';
import { Search, X } from 'lucide-react';

interface ClassSearchFiltersProps {
  products: Array<{ id: string; name: string }>;
  onFilterChange: (filters: {
    productId?: string;
    searchTerm?: string;
  }) => void;
}

export const ClassSearchFilters = ({
  products,
  onFilterChange,
}: ClassSearchFiltersProps) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    onFilterChange({
      productId: productId || undefined,
      searchTerm,
    });
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    onFilterChange({
      productId: selectedProduct || undefined,
      searchTerm: term,
    });
  };

  const handleClear = () => {
    setSelectedProduct('');
    setSearchTerm('');
    onFilterChange({});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro por Produto */}
        <Select
          label="Filtrar por Produto"
          options={[
            { value: '', label: '📊 Todos os Produtos' },
            ...products.map(p => ({ value: p.id, label: p.name }))
          ]}
          value={selectedProduct}
          onChange={(e) => handleProductChange(e.target.value)}
          placeholder="Escolha um produto..."
        />

        {/* Busca por Descrição */}
        <Input
          label="Buscar Aula"
          placeholder="Digite parte da descrição..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Botão Limpar Filtros */}
      {(selectedProduct || searchTerm) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClear}
          icon={<X className="w-4 h-4" />}
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  );
};
