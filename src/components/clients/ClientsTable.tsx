import { Badge, Button, Card, Checkbox, Select, Skeleton } from "@/components/ui/ds";
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Clock, MoreVertical, ExternalLink, CheckCircle, Phone, Trash2, Calendar, ShoppingBag, DollarSign, Plus } from 'lucide-react';
import { SortField, SortDir } from '@/hooks/useClientsFilter';
import { useState } from 'react';

interface ClientLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_client?: boolean;
  became_client_at?: string;
}

interface ClientSale {
  id: string;
  productId: string;
  value: number;
  date: string;
  status: string;
}

interface ClientInteraction {
  id: string;
  date: string;
}

interface SimpleProduct {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  ativo: 'bg-success/20 text-success border-success/30',
  concluído: 'bg-info/20 text-info border-info/30',
  cancelado: 'bg-muted text-neutral-500 border-border',
  pendência: 'bg-warning/20 text-warning border-warning/30',
};

const statusBarColors: Record<string, string> = {
  ativo: 'bg-success',
  concluído: 'bg-info',
  cancelado: 'bg-neutral-300',
  pendência: 'bg-warning',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function relativeDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

interface Props {
  clients: ClientLead[];
  getClientSales: (id: string) => ClientSale[];
  getLastInteraction: (id: string) => ClientInteraction | null;
  sortField: SortField;
  sortDir: SortDir;
  toggleSort: (field: SortField) => void;
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  page: number;
  setPage: (p: number) => void;
  perPage: number;
  setPerPage: (p: number) => void;
  totalPages: number;
  totalFiltered: number;
  loading?: boolean;
  onNewSale?: (leadId?: string) => void;
  products?: SimpleProduct[];
  onSelectClient?: (client: ClientLead) => void;
}

export default function ClientsTable({
  clients, getClientSales, getLastInteraction,
  sortField, sortDir, toggleSort,
  selectedIds, toggleSelect, toggleSelectAll,
  page, setPage, perPage, setPerPage, totalPages, totalFiltered,
  loading, onNewSale, products = [], onSelectClient,
}: Props) {
  const navigate = useNavigate();
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || '—';
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-neutral-500" />
        </div>
        <p className="text-neutral-500 text-sm">Nenhum cliente encontrado.</p>
        <p className="text-neutral-500 text-xs mt-1">Ajuste os filtros ou cadastre um novo cliente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Sort and Select All - mimicking LeadsPage style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-100 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedIds.length === clients.length && clients.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-neutral-500 font-medium uppercase">Selecionar todos</span>
        </div>
        
        <div className="flex items-center gap-4 flex-1 md:justify-end">
          <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">Ordenar por:</span>
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => toggleSort(e.target.value as SortField)}
              className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
            >
              <option value="name">🔤 Nome</option>
              <option value="value">💰 Valor</option>
              <option value="date">📅 Data Compra</option>
              <option value="status">🏷️ Status</option>
              <option value="lastInteraction">💬 Interação</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleSort(sortField)}
              className="h-9 px-3"
            >
              {sortDir === 'desc' ? '↓ Decrescente' : '↑ Crescente'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {clients.map(client => {
          const clientSales = getClientSales(client.id);
          const totalValue = clientSales.reduce((s, x) => s + x.value, 0);
          const lastSale = [...clientSales].sort((a, b) => b.date.localeCompare(a.date))[0];
          const lastInt = getLastInteraction(client.id);
          const status = lastSale?.status || '—';

          return (
            <Card 
              key={client.id} 
              padding="none" 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (onSelectClient) onSelectClient(client);
                else navigate(`/clientes/${client.id}`);
              }}
            >
              {/* Top bar like leads */}
              <div className={`h-1 w-full ${statusBarColors[status] || 'bg-neutral-200'}`} />
              
              <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(client.id)}
                      onCheckedChange={() => toggleSelect(client.id)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-900 text-sm hover:underline hover:text-primary-600">
                        {client.name}
                      </span>
                      {lastSale && (
                        <Badge className={`text-[10px] uppercase font-bold border ${statusColors[lastSale.status] || ''}`}>
                          {lastSale.status}
                        </Badge>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {clientSales.slice(0, 2).map(s => (
                          <Badge key={s.id} variant="secondary" className="text-[10px]">{getProductName(s.productId)}</Badge>
                        ))}
                        {clientSales.length > 2 && <Badge variant="secondary" className="text-[10px]">+{clientSales.length - 2}</Badge>}
                      </div>
                    </div>
                    
                    {/* Information Grid requested by user: Telefone, produto, valor, data da compra, status, ações */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 mt-3">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500" onClick={e => e.stopPropagation()}>
                          <Phone className="h-3.5 w-3.5 text-success-600" />
                          <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-success-700 font-medium">
                            {client.phone}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="font-semibold text-neutral-900">R$ {totalValue.toLocaleString('pt-BR')}</span>
                      </div>
                      
                      {lastSale && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          <span>Compra: {formatDate(lastSale.date)}</span>
                        </div>
                      )}
                      
                      {lastInt && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>Interação: {relativeDate(lastInt.date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions requested by user */}
                <div className="flex items-center gap-1 w-full md:w-auto justify-end border-t md:border-0 pt-3 md:pt-0" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/clientes/${client.id}`)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    
                    {openMenu === client.id && (
                      <div className="absolute right-0 z-50 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 shadow-xl">
                        <button 
                          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 text-neutral-700" 
                          onClick={() => { navigate(`/clientes/${client.id}`); setOpenMenu(null); }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Ver detalhes
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 text-neutral-700" 
                          onClick={() => { onNewSale?.(client.id); setOpenMenu(null); }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Nova venda
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>{totalFiltered} clientes</span>
          <Select value={String(perPage)} onValueChange={v => setPerPage(Number(v))}>
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-8 px-3" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <div className="flex items-center px-4 h-8 text-sm font-medium text-neutral-900">
            {page} de {totalPages}
          </div>
          <Button variant="secondary" size="sm" className="h-8 px-3" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
        </div>
      </div>
    </div>
  );
}
