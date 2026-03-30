import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Clock, MoreVertical, ExternalLink } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortField, SortDir } from '@/hooks/useClientsFilter';

interface ClientLead {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  cancelado: 'bg-muted text-muted-foreground border-border',
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
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
        <p className="text-muted-foreground text-xs mt-1">Ajuste os filtros ou cadastre um novo cliente.</p>
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
            className="rounded-xl border border-border/60 bg-card p-4 cursor-pointer hover-lift shadow-card transition-all"
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
                  <p className="font-medium text-foreground text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/clientes/${client.id}`); }}>Ver detalhes</DropdownMenuItem>
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); onNewSale?.(client.id); }}>Nova venda</DropdownMenuItem>
                  <DropdownMenuItem>Registrar interação</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {clientSales.slice(0, 2).map(s => (
                <Badge key={s.id} variant="outline" className="text-[10px]">{getProductName(s.productId)}</Badge>
              ))}
              {clientSales.length > 2 && <Badge variant="outline" className="text-[10px]">+{clientSales.length - 2}</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-success">R$ {totalValue.toLocaleString('pt-BR')}</span>
              {lastSale && <Badge className={`text-[10px] ${statusColors[lastSale.status] || ''}`}>{lastSale.status}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Desktop table view
  const desktopView = (
    <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden shadow-card bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10">
              <Checkbox
                checked={selectedIds.length === clients.length && clients.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
              <div className="flex items-center">Nome <SortIcon field="name" current={sortField} dir={sortDir} /></div>
            </TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('value')}>
              <div className="flex items-center">Valor <SortIcon field="value" current={sortField} dir={sortDir} /></div>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date')}>
              <div className="flex items-center">Data Compra <SortIcon field="date" current={sortField} dir={sortDir} /></div>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
              <div className="flex items-center">Status <SortIcon field="status" current={sortField} dir={sortDir} /></div>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('lastInteraction')}>
              <div className="flex items-center">Última Interação <SortIcon field="lastInteraction" current={sortField} dir={sortDir} /></div>
            </TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map(client => {
            const clientSales = getClientSales(client.id);
            const totalValue = clientSales.reduce((s, x) => s + x.value, 0);
            const lastSale = clientSales.sort((a, b) => b.date.localeCompare(a.date))[0];
            const lastInt = getLastInteraction(client.id);

            return (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors group"
                onClick={() => {
                  if (onSelectClient) onSelectClient(client as any);
                  else navigate(`/clientes/${client.id}`);
                }}
              >
                <TableCell onClick={e => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.includes(client.id)} onCheckedChange={() => toggleSelect(client.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getInitialColor(client.name)}`}>
                      {getInitials(client.name)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  {client.phone ? (
                    <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-success hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      {client.phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
                    </a>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {clientSales.slice(0, 2).map(s => (
                      <Badge key={s.id} variant="outline" className="text-[10px] whitespace-nowrap">{getProductName(s.productId)}</Badge>
                    ))}
                    {clientSales.length > 2 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[10px]">+{clientSales.length - 2}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {clientSales.slice(2).map(s => getProductName(s.productId)).join(', ')}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-sm text-success">R$ {totalValue.toLocaleString('pt-BR')}</span>
                </TableCell>
                <TableCell>
                  {lastSale ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-foreground">{formatDate(lastSale.date)}</span>
                      </TooltipTrigger>
                      <TooltipContent>{relativeDate(lastSale.date)}</TooltipContent>
                    </Tooltip>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {lastSale ? <Badge className={`text-[10px] ${statusColors[lastSale.status] || ''}`}>{lastSale.status}</Badge> : '—'}
                </TableCell>
                <TableCell>
                  {lastInt ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground">{relativeDate(lastInt.date)}</span>
                      </TooltipTrigger>
                      <TooltipContent>{lastInt.date}</TooltipContent>
                    </Tooltip>
                  ) : <span className="text-sm text-muted-foreground">—</span>}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/clientes/${client.id}`)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/clientes/${client.id}`)}>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onNewSale?.(client.id)}>Nova venda</DropdownMenuItem>
                        <DropdownMenuItem>Registrar interação</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selectedIds.length >= 2 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selecionados</span>
          <Button variant="outline" size="sm" className="h-7 text-xs">Exportar selecionados</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs">Atribuir responsável</Button>
        </div>
      )}

      {mobileView}
      {desktopView}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{totalFiltered} clientes</span>
          <Select value={String(perPage)} onValueChange={v => setPerPage(Number(v))}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>por página</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
        </div>
      </div>
    </div>
  );
}
