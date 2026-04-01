import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface SearchResult {
  id: string;
  type: 'lead' | 'client' | 'task' | 'sale' | 'product';
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

export function useGlobalSearch() {
  const { organizationId } = useOrganization();
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

  const search = useCallback(async (query: string) => {
    if (!query.trim() || !organizationId) {
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

    setLoading(true);
    setError(null);

    try {
      console.log('[useGlobalSearch] Buscando:', query);

      const searchTerm = `%${query}%`;

      // Parallelized search across tables
      const [leadsRes, clientsRes, tasksRes, salesRes, productsRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id, name, email, phone, pipeline_stage, created_at')
          .eq('organization_id', organizationId)
          .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('clients')
          .select('id, name, email, phone, created_at')
          .eq('organization_id', organizationId)
          .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('tasks')
          .select('id, title, description, status, due_date')
          .eq('organization_id', organizationId)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('sales')
          .select('id, title, client_id, value, status, created_at')
          .eq('organization_id', organizationId)
          .or(`title.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('products')
          .select('id, name, description, price, type')
          .eq('organization_id', organizationId)
          .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10),
      ]);

      // Handle Errors
      if (leadsRes.error) console.error('[useGlobalSearch] Erro em leads:', leadsRes.error);
      if (clientsRes.error) console.error('[useGlobalSearch] Erro em clientes:', clientsRes.error);
      if (tasksRes.error) console.error('[useGlobalSearch] Erro em tarefas:', tasksRes.error);
      if (salesRes.error) console.error('[useGlobalSearch] Erro em vendas:', salesRes.error);
      if (productsRes.error) console.error('[useGlobalSearch] Erro em produtos:', productsRes.error);

      // Transform leads
      const leadsResults: SearchResult[] = (leadsRes.data || []).map(lead => ({
        id: lead.id,
        type: 'lead',
        title: lead.name,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        status: lead.pipeline_stage || undefined,
        path: `/leads`, // Navigating to leads page with potential filtering
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
        description: task.description || undefined,
        status: task.status || undefined,
        date: task.due_date || undefined,
        path: `/tarefas`,
      }));

      // Transform sales
      const vendasResults: SearchResult[] = (salesRes.data || []).map(sale => ({
        id: sale.id,
        type: 'sale',
        title: sale.title || 'Venda sem título',
        value: sale.value || undefined,
        status: sale.status || undefined,
        path: `/vendas`,
      }));

      // Transform products
      const produtosResults: SearchResult[] = (productsRes.data || []).map(product => ({
        id: product.id,
        type: 'product',
        title: product.name,
        description: product.description || undefined,
        value: product.price || undefined,
        status: product.type || undefined,
        path: `/produtos`,
      }));

      const total = 
        leadsResults.length +
        clientesResults.length +
        tarefasResults.length +
        vendasResults.length +
        produtosResults.length;

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

  return { results, loading, error, search };
}
