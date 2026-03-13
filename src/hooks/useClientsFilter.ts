import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLeadsData, LeadView } from '@/hooks/useLeadsData';
import { useDataAccess } from '@/hooks/useDataAccess';

interface SaleView {
  id: string;
  leadId: string;
  productId: string;
  value: number;
  date: string;
  paymentMethod: string;
  status: string;
}

interface InteractionView {
  id: string;
  leadId: string;
  date: string;
  type: string;
  note: string;
}

interface ProductView {
  id: string;
  name: string;
  type: string;
}

export interface ClientsFilterState {
  search: string;
  products: { ids: string[]; logic: 'AND' | 'OR' };
  valueRange: { min: number; max: number };
  dateRange: { from: string; to: string };
  saleStatuses: { values: string[]; logic: 'AND' | 'OR' };
  origins: { values: string[]; logic: 'AND' | 'OR' };
  responsibles: { ids: string[]; logic: 'AND' | 'OR' };
  lastInteraction: { from: string; to: string; preset: string };
}

const STORAGE_KEY = 'clients_filters';

const defaultFilters: ClientsFilterState = {
  search: '',
  products: { ids: [], logic: 'AND' },
  valueRange: { min: 0, max: 10000 },
  dateRange: { from: '', to: '' },
  saleStatuses: { values: [], logic: 'AND' },
  origins: { values: [], logic: 'AND' },
  responsibles: { ids: [], logic: 'AND' },
  lastInteraction: { from: '', to: '', preset: '' },
};

function loadFilters(): ClientsFilterState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultFilters, ...JSON.parse(raw) };
  } catch {}
  return defaultFilters;
}

export type SortField = 'name' | 'value' | 'date' | 'status' | 'lastInteraction';
export type SortDir = 'asc' | 'desc';

export function useClientsFilter() {
  const { leads, pipelineStages, origins: originsList, loading } = useLeadsData();
  const dataAccess = useDataAccess();

  const [sales, setSales] = useState<SaleView[]>([]);
  const [interactions, setInteractions] = useState<InteractionView[]>([]);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [filters, setFilters] = useState<ClientsFilterState>(loadFilters);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch sales, interactions, products from Supabase
  useEffect(() => {
    if (!dataAccess) return;
    Promise.allSettled([
      dataAccess.getSales(),
      dataAccess.getInteractions(),
      dataAccess.getProducts(),
    ]).then(([salesRes, intRes, prodRes]) => {
      if (salesRes.status === 'fulfilled') {
        setSales((salesRes.value as any[]).map(s => ({
          id: s.id,
          leadId: s.lead_id,
          productId: s.product_id || '',
          value: Number(s.value) || 0,
          date: s.sale_date || '',
          paymentMethod: s.payment_method || '',
          status: s.status || 'ativo',
        })));
      }
      if (intRes.status === 'fulfilled') {
        setInteractions((intRes.value as any[]).map(i => ({
          id: i.id,
          leadId: i.lead_id,
          date: i.interaction_date || '',
          type: i.type,
          note: i.note || '',
        })));
      }
      if (prodRes.status === 'fulfilled') {
        setProducts((prodRes.value as any[]).map(p => ({
          id: p.id,
          name: p.name,
          type: p.type || '',
        })));
      }
    });
  }, [dataAccess]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof ClientsFilterState>(key: K, value: ClientsFilterState[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    localStorage.removeItem(STORAGE_KEY);
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.search) c++;
    if (filters.products.ids.length) c++;
    if (filters.valueRange.min > 0 || filters.valueRange.max < 10000) c++;
    if (filters.dateRange.from || filters.dateRange.to) c++;
    if (filters.saleStatuses.values.length) c++;
    if (filters.origins.values.length) c++;
    if (filters.responsibles.ids.length) c++;
    if (filters.lastInteraction.from || filters.lastInteraction.to || filters.lastInteraction.preset) c++;
    return c;
  }, [filters]);

  // Clients = leads at pipeline stage named "Cliente"
  const clients = useMemo(() => {
    return leads.filter(l => {
      const stage = pipelineStages.find(s => s.id === l.pipelineStage);
      return stage?.name === 'Cliente';
    });
  }, [leads, pipelineStages]);

  const getClientSales = useCallback((leadId: string) => sales.filter(s => s.leadId === leadId), [sales]);
  const getLastInteraction = useCallback((leadId: string) => {
    const li = interactions.filter(i => i.leadId === leadId).sort((a, b) => b.date.localeCompare(a.date));
    return li[0] || null;
  }, [interactions]);

  const saleStatuses = ['ativo', 'concluído', 'cancelado', 'pendência'];
  const users: string[] = []; // TODO: fetch from org members if needed

  const filteredClients = useMemo(() => {
    let result = clients;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }

    if (filters.products.ids.length) {
      result = result.filter(c => {
        const clientProductIds = getClientSales(c.id).map(s => s.productId);
        if (filters.products.logic === 'AND') {
          return filters.products.ids.every(pid => clientProductIds.includes(pid));
        }
        return filters.products.ids.some(pid => clientProductIds.includes(pid));
      });
    }

    if (filters.valueRange.min > 0 || filters.valueRange.max < 10000) {
      result = result.filter(c => {
        const clientSales = getClientSales(c.id);
        return clientSales.some(s => s.value >= filters.valueRange.min && s.value <= filters.valueRange.max);
      });
    }

    if (filters.dateRange.from || filters.dateRange.to) {
      result = result.filter(c => {
        const clientSales = getClientSales(c.id);
        return clientSales.some(s => {
          if (filters.dateRange.from && s.date < filters.dateRange.from) return false;
          if (filters.dateRange.to && s.date > filters.dateRange.to) return false;
          return true;
        });
      });
    }

    if (filters.saleStatuses.values.length) {
      result = result.filter(c => {
        const statuses = getClientSales(c.id).map(s => s.status);
        if (filters.saleStatuses.logic === 'AND') {
          return filters.saleStatuses.values.every(st => statuses.includes(st));
        }
        return filters.saleStatuses.values.some(st => statuses.includes(st));
      });
    }

    if (filters.origins.values.length) {
      result = result.filter(c => {
        if (filters.origins.logic === 'AND') {
          return filters.origins.values.every(o => c.origin === o);
        }
        return filters.origins.values.some(o => c.origin === o);
      });
    }

    if (filters.responsibles.ids.length) {
      result = result.filter(c => {
        if (filters.responsibles.logic === 'AND') {
          return filters.responsibles.ids.every(r => c.responsible === r);
        }
        return filters.responsibles.ids.some(r => c.responsible === r);
      });
    }

    if (filters.lastInteraction.from || filters.lastInteraction.to || filters.lastInteraction.preset) {
      result = result.filter(c => {
        const li = getLastInteraction(c.id);
        if (!li) {
          return filters.lastInteraction.preset === 'no_interaction_30';
        }
        let from = filters.lastInteraction.from;
        let to = filters.lastInteraction.to;
        if (filters.lastInteraction.preset) {
          const now = new Date();
          to = now.toISOString().split('T')[0];
          if (filters.lastInteraction.preset === '7d') {
            from = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
          } else if (filters.lastInteraction.preset === '30d') {
            from = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
          } else if (filters.lastInteraction.preset === 'no_interaction_30') {
            return new Date(li.date).getTime() < now.getTime() - 30 * 86400000;
          }
        }
        if (from && li.date < from) return false;
        if (to && li.date > to) return false;
        return true;
      });
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'value': {
          const va = getClientSales(a.id).reduce((s, x) => s + x.value, 0);
          const vb = getClientSales(b.id).reduce((s, x) => s + x.value, 0);
          cmp = va - vb; break;
        }
        case 'date': {
          const da = getClientSales(a.id).sort((x, y) => y.date.localeCompare(x.date))[0]?.date || '';
          const db = getClientSales(b.id).sort((x, y) => y.date.localeCompare(x.date))[0]?.date || '';
          cmp = da.localeCompare(db); break;
        }
        case 'status': {
          const sa = getClientSales(a.id)[0]?.status || '';
          const sb = getClientSales(b.id)[0]?.status || '';
          cmp = sa.localeCompare(sb); break;
        }
        case 'lastInteraction': {
          const la = getLastInteraction(a.id)?.date || '';
          const lb = getLastInteraction(b.id)?.date || '';
          cmp = la.localeCompare(lb); break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [clients, filters, sortField, sortDir, getClientSales, getLastInteraction]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / perPage));
  const paginatedClients = filteredClients.slice((page - 1) * perPage, page * perPage);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }, [sortField]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === paginatedClients.length) setSelectedIds([]);
    else setSelectedIds(paginatedClients.map(c => c.id));
  }, [selectedIds, paginatedClients]);

  const getActiveFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.search) chips.push({ key: 'search', label: `Busca: "${filters.search}"` });
    if (filters.products.ids.length) {
      const names = filters.products.ids.map(id => products.find(p => p.id === id)?.name || id);
      chips.push({ key: 'products', label: `Produtos: ${names.join(` ${filters.products.logic === 'AND' ? 'E' : 'OU'} `)}` });
    }
    if (filters.valueRange.min > 0 || filters.valueRange.max < 10000) {
      chips.push({ key: 'valueRange', label: `Valor: R$ ${filters.valueRange.min} – R$ ${filters.valueRange.max}` });
    }
    if (filters.dateRange.from || filters.dateRange.to) {
      chips.push({ key: 'dateRange', label: `Data: ${filters.dateRange.from || '...'} – ${filters.dateRange.to || '...'}` });
    }
    if (filters.saleStatuses.values.length) {
      chips.push({ key: 'saleStatuses', label: `Status: ${filters.saleStatuses.values.join(', ')}` });
    }
    if (filters.origins.values.length) {
      chips.push({ key: 'origins', label: `Origem: ${filters.origins.values.join(', ')}` });
    }
    if (filters.responsibles.ids.length) {
      chips.push({ key: 'responsibles', label: `Responsável: ${filters.responsibles.ids.join(', ')}` });
    }
    if (filters.lastInteraction.preset || filters.lastInteraction.from) {
      const presetLabels: Record<string, string> = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', 'no_interaction_30': 'Sem interação 30+ dias' };
      chips.push({ key: 'lastInteraction', label: `Interação: ${presetLabels[filters.lastInteraction.preset] || `${filters.lastInteraction.from} – ${filters.lastInteraction.to}`}` });
    }
    return chips;
  }, [filters, products]);

  const removeFilterChip = useCallback((key: string) => {
    setFilters(f => {
      const nf = { ...f };
      switch (key) {
        case 'search': nf.search = ''; break;
        case 'products': nf.products = { ids: [], logic: 'AND' }; break;
        case 'valueRange': nf.valueRange = { min: 0, max: 10000 }; break;
        case 'dateRange': nf.dateRange = { from: '', to: '' }; break;
        case 'saleStatuses': nf.saleStatuses = { values: [], logic: 'AND' }; break;
        case 'origins': nf.origins = { values: [], logic: 'AND' }; break;
        case 'responsibles': nf.responsibles = { ids: [], logic: 'AND' }; break;
        case 'lastInteraction': nf.lastInteraction = { from: '', to: '', preset: '' }; break;
      }
      return nf;
    });
    setPage(1);
  }, []);

  return {
    filters, updateFilter, resetFilters, activeFilterCount,
    filteredClients: paginatedClients, totalFiltered: filteredClients.length,
    page, setPage, perPage, setPerPage, totalPages,
    sortField, sortDir, toggleSort,
    selectedIds, toggleSelect, toggleSelectAll,
    getActiveFilterChips, removeFilterChip,
    getClientSales, getLastInteraction,
    products, origins: originsList, users, saleStatuses,
    loading,
  };
}
