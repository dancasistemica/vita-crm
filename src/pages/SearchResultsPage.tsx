import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { SearchResults } from '@/components/search/SearchResults';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/ds';
import { useNavigate } from 'react-router-dom';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const { results, loading, error, search } = useGlobalSearch();
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(queryParam);

  useEffect(() => {
    // Sincroniza localQuery com queryParam apenas na primeira carga ou se o queryParam mudar externamente
    if (queryParam && !localQuery) {
      setLocalQuery(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    if (localQuery.trim()) {
      const timer = setTimeout(() => {
        console.log('[SearchResultsPage] Real-time search for:', localQuery);
        search(localQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [localQuery, search]);

  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(localQuery);
  };

  const combinedResults = [
    ...results.leads,
    ...results.clientes,
    ...results.tarefas,
    ...results.vendas,
    ...results.produtos,
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">Resultados da Busca</h1>
        </div>

        <form onSubmit={handleLocalSearch} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Buscar em todo o CRM..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-neutral-500 font-medium">Pesquisando em todos os canais...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-center">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <p className="text-neutral-600">
              Encontramos <span className="font-bold text-neutral-900">{results.total}</span> resultados para "<span className="font-bold text-neutral-900">{queryParam}</span>"
            </p>
          </div>

          <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
            <SearchResults 
              results={combinedResults} 
              loading={false} 
              query={queryParam} 
              onSelect={(result) => {
                if (result.path) {
                  navigate(result.path);
                }
              }}
            />
          </div>

          {results.total === 0 && (
            <div className="text-center py-20 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
              <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-neutral-500">
                Tente usar palavras-chave diferentes ou verifique a ortografia.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
