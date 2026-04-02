import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { sanitizeInput, validateStringLength, RateLimiter } from '@/lib/security';

export type SearchResultType = 'lead' | 'client' | 'task' | 'sale' | 'product';

export interface SearchResult {
  id: string;
  type: SearchResultType | 'cliente' | 'tarefa' | 'venda' | 'produto';
  title: string;
  description?: string;
  email?: string;
  phone?: string;
  status?: string;
  value?: number;
  date?: string;
  path: string;
}

interface SearchResults {
  leads: SearchResult[];
  clientes: SearchResult[];
  tarefas: SearchResult[];
  vendas: SearchResult[];
  produtos: SearchResult[];
  total: number;
}

// Rate limiter para busca (máximo 10 buscas por minuto)
const searchRateLimiter = new RateLimiter(120, 60000); // Aumentado para 120 buscas por minuto para suportar busca em tempo real durante a digitação

export function useGlobalSearch() {
  const { organizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    leads: [],
    clientes: [],
    tarefas: [],
    vendas: [],
    produtos: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchIdRef = useRef<number>(0);

  const clearResults = useCallback(() => {
    setResults({
      leads: [],
      clientes: [],
      tarefas: [],
      vendas: [],
      produtos: [],
      total: 0,
    });
  }, []);

  const search = useCallback(async (searchTerm: string) => {
    // Validar e sanitizar input
    const sanitizedQuery = sanitizeInput(searchTerm.trim());

    if (!sanitizedQuery || !organizationId) {
      setResults({
        leads: [],
        clientes: [],
        tarefas: [],
        vendas: [],
        produtos: [],
        total: 0,
      });
      return;
    }

    // Validar comprimento (mínimo 2, máximo 100 caracteres)
    if (!validateStringLength(sanitizedQuery, 2, 100)) {
      console.warn('[useGlobalSearch] Termo de busca muito curto ou longo');
      return;
    }

    // Aplicar Rate Limiting
    if (!searchRateLimiter.isAllowed('global-search')) {
      setError('Muitas buscas em pouco tempo. Tente novamente em 1 minuto.');
      return;
    }

    // setQuery(sanitizedQuery); // Removido para evitar sobrescrever a digitação do usuário durante a busca debounced
    setLoading(true);
    setError(null);

    const currentSearchId = ++searchIdRef.current;

    try {
      console.log(`[useGlobalSearch] Buscando (#${currentSearchId}):`, sanitizedQuery);

      const ilikeTerm = `%${sanitizedQuery}%`;

      // Parallelized search across tables
      const [leadsRes, clientsRes, tasksRes, salesRes, productsRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id, name, email, phone, pipeline_stage')
          .eq('organization_id', organizationId)
          .or(`name.ilike.${ilikeTerm},email.ilike.${ilikeTerm},phone.ilike.${ilikeTerm}`)
          .limit(10),
        supabase
          .from('clients')
          .select('id, name, email, phone')
          .eq('organization_id', organizationId)
          .or(`name.ilike.${ilikeTerm},email.ilike.${ilikeTerm},phone.ilike.${ilikeTerm}`)
          .limit(10),
        supabase
          .from('tasks')
          .select('id, title, due_date')
          .eq('organization_id', organizationId)
          .ilike('title', ilikeTerm)
          .limit(10),
        supabase
          .from('sales')
          .select('id, notes, value, status')
          .eq('organization_id', organizationId)
          .or(`notes.ilike.${ilikeTerm},status.ilike.${ilikeTerm}`)
          .limit(10),
        supabase
          .from('products')
          .select('id, name, description, type')
          .eq('organization_id', organizationId)
          .or(`name.ilike.${ilikeTerm},description.ilike.${ilikeTerm}`)
          .limit(10),
      ]);

      // Transform leads
      const leadsResults: SearchResult[] = (leadsRes.data || []).map(lead => ({
        id: lead.id,
        type: 'lead',
        title: lead.name,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        status: lead.pipeline_stage || undefined,
        path: `/leads`,
      }));

      // Transform clients
      const clientesResults: SearchResult[] = (clientsRes.data || []).map(client => ({
        id: client.id,
        type: 'client',
        title: client.name,
        email: client.email || undefined,
        phone: client.phone || undefined,
        path: `/clientes/${client.id}`,
      }));

      // Transform tasks
      const tarefasResults: SearchResult[] = (tasksRes.data || []).map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        date: task.due_date || undefined,
        path: `/tarefas`,
      }));

      // Transform sales
      const vendasResults: SearchResult[] = (salesRes.data || []).map(sale => ({
        id: sale.id,
        type: 'sale',
        title: sale.notes || 'Venda',
        value: Number(sale.value) || undefined,
        status: sale.status || undefined,
        path: `/vendas`,
      }));

      // Transform products
      const produtosResults: SearchResult[] = (productsRes.data || []).map(product => ({
        id: product.id,
        type: 'product',
        title: product.name,
        description: product.description || undefined,
        status: product.type || undefined,
        path: `/produtos`,
      }));

      const total = 
        leadsResults.length +
        clientesResults.length +
        tarefasResults.length +
        vendasResults.length +
        produtosResults.length;

      if (currentSearchId !== searchIdRef.current) {
        console.log(`[useGlobalSearch] Ignorando resultado da busca anterior (#${currentSearchId})`);
        return;
      }

      setResults({
        leads: leadsResults,
        clientes: clientesResults,
        tarefas: tarefasResults,
        vendas: vendasResults,
        produtos: produtosResults,
        total,
      });

      console.log('[useGlobalSearch] Resultados encontrados:', total);
    } catch (err) {
      console.error('[useGlobalSearch] Erro na busca:', err);
      setError('Erro ao realizar busca');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return { query, setQuery, results, loading, error, search, clearResults };
}
