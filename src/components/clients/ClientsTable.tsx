import { Badge, Button, Checkbox, Select, Skeleton } from "@/components/ui/ds";
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Clock, MoreVertical, ExternalLink, CheckCircle } from 'lucide-react';
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

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getInitialColor(name: string) {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-accent/20 text-accent',
    'bg-success/20 text-success',
    'bg-info/20 text-info',
    'bg-warning/20 text-warning',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

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

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
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
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
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

  // Mobile card view
  const mobileView = (
    <div className="space-y-3 md:hidden">
      {clients.map(client => {
        const clientSales = getClientSales(client.id);
        const totalValue = clientSales.reduce((s, x) => s + x.value, 0);
        const lastSale = clientSales.sort((a, b) => b.date.localeCompare(a.date))[0];
        const lastInt = getLastInteraction(client.id);

        return (
          <div
            key={client.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              if (onSelectClient) onSelectClient(client as any);
              else navigate(`/clientes/${client.id}`);
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${getInitialColor(client.name)}`}>
                  {getInitials(client.name)}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-sm">{client.name}</p>
                   <p className="text-xs text-neutral-500">{client.email}</p>
                   {client.is_client && client.became_client_at && (
                     <div className="mt-1 flex items-center gap-1.5 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded w-fit">
                       <CheckCircle className="w-2.5 h-2.5" />
                       <span>Cliente desde {new Date(client.became_client_at).toLocaleDateString('pt-BR')}</span>
                     </div>
                   )}
                </div>
              </div>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8" 
                  onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === client.id ? null : client.id); }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {openMenu === client.id && (
                  <div className="absolute right-0 z-50 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50" onClick={e => { e.stopPropagation(); navigate(`/clientes/${client.id}`); setOpenMenu(null); }}>Ver detalhes</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50" onClick={e => { e.stopPropagation(); onNewSale?.(client.id); setOpenMenu(null); }}>Nova venda</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {clientSales.slice(0, 2).map(s => (
                <Badge key={s.id} variant="secondary" className="text-[10px]">{getProductName(s.productId)}</Badge>
              ))}
              {clientSales.length > 2 && <Badge variant="secondary" className="text-[10px]">+{clientSales.length - 2}</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-success-600">R$ {totalValue.toLocaleString('pt-BR')}</span>
              {lastSale && <Badge className={`text-[10px] ${statusColors[lastSale.status] || ''}`}>{lastSale.status}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Desktop table view
  const desktopView = (
    <div className="hidden md:block rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-4 py-3 text-left w-10">
              <Checkbox
                checked={selectedIds.length === clients.length && clients.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('name')}>
              <div className="flex items-center">Nome <SortIcon field="name" current={sortField} dir={sortDir} /></div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Telefone</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Produto</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('value')}>
              <div className="flex items-center">Valor <SortIcon field="value" current={sortField} dir={sortDir} /></div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('date')}>
              <div className="flex items-center">Data Compra <SortIcon field="date" current={sortField} dir={sortDir} /></div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('status')}>
              <div className="flex items-center">Status <SortIcon field="status" current={sortField} dir={sortDir} /></div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('lastInteraction')}>
              <div className="flex items-center">Última Interação <SortIcon field="lastInteraction" current={sortField} dir={sortDir} /></div>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {clients.map(client => {
            const clientSales = getClientSales(client.id);
            const totalValue = clientSales.reduce((s, x) => s + x.value, 0);
            const lastSale = clientSales.sort((a, b) => b.date.localeCompare(a.date))[0];
            const lastInt = getLastInteraction(client.id);

            return (
              <tr 
                key={client.id}
                className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                onClick={() => {
                  if (onSelectClient) onSelectClient(client as any);
                  else navigate(`/clientes/${client.id}`);
                }}
              >
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.includes(client.id)} onCheckedChange={() => toggleSelect(client.id)} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getInitialColor(client.name)}`}>
                      {getInitials(client.name)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{client.name}</p>
                      <p className="text-xs text-neutral-500">{client.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  {client.phone ? (
                    <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-success-600 hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      {client.phone}
                    </a>
                  ) : '—'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {clientSales.slice(0, 2).map(s => (
                      <Badge key={s.id} variant="secondary" className="text-[10px] whitespace-nowrap">{getProductName(s.productId)}</Badge>
                    ))}
                    {clientSales.length > 2 && (
                      <Badge variant="secondary" className="text-[10px]" title={clientSales.slice(2).map(s => getProductName(s.productId)).join(', ')}>
                        +{clientSales.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-sm text-success-600">R$ {totalValue.toLocaleString('pt-BR')}</span>
                </td>
                <td className="px-4 py-4">
                  {lastSale ? <span className="text-sm text-neutral-900" title={relativeDate(lastSale.date)}>{formatDate(lastSale.date)}</span> : '—'}
                </td>
                <td className="px-4 py-4">
                  {lastSale ? <Badge className={`text-[10px] ${statusColors[lastSale.status] || ''}`}>{lastSale.status}</Badge> : '—'}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-neutral-500">{lastInt ? relativeDate(lastInt.date) : '—'}</span>
                </td>
                <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => navigate(`/clientes/${client.id}`)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <div className="relative">
                      <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => setOpenMenu(openMenu === `row-${client.id}` ? null : `row-${client.id}`)}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {openMenu === `row-${client.id}` && (
                        <div className="absolute right-0 z-50 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-left">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50" onClick={() => { navigate(`/clientes/${client.id}`); setOpenMenu(null); }}>Ver detalhes</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50" onClick={() => { onNewSale?.(client.id); setOpenMenu(null); }}>Nova venda</button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {selectedIds.length >= 2 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
          <span className="text-sm font-medium text-neutral-900">{selectedIds.length} selecionados</span>
          <Button variant="secondary" size="sm" className="h-8 text-xs">Exportar selecionados</Button>
          <Button variant="secondary" size="sm" className="h-8 text-xs">Atribuir responsável</Button>
        </div>
      )}

      {mobileView}
      {desktopView}

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
