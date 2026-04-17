import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getInstallments, getInstallmentStats, Installment } from '@/services/installmentService';
import { Card, Button, Alert, Input, Skeleton } from '@/components/ui/ds';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  ArrowRight,
  MoreVertical,
  RefreshCw,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import InstallmentModal from '@/components/InstallmentModal';

export default function InstallmentsPage() {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'todos',
    type: 'todos',
    clientId: '',
    productId: '',
    searchTerm: ''
  });
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (!organizationId) return;

        const [installmentsData, statsData] = await Promise.all([
          getInstallments(organizationId, {
            status: filters.status !== 'todos' ? filters.status : undefined,
            type: filters.type !== 'todos' ? filters.type : undefined,
            clientId: filters.clientId || undefined,
            productId: filters.productId || undefined,
          }),
          getInstallmentStats(organizationId)
        ]);

        setInstallments(installmentsData);
        setStats(statsData);
      } catch (error) {
        console.error('[InstallmentsPage] ❌ ERRO ao carregar:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadData();
    }
  }, [organizationId, filters.status, filters.type, filters.clientId, filters.productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, statistics] = await Promise.all([
        getInstallments(organizationId!, {
          status: filters.status !== 'todos' ? filters.status : undefined,
          type: filters.type !== 'todos' ? filters.type : undefined,
          clientId: filters.clientId || undefined,
          productId: filters.productId || undefined,
        }),
        getInstallmentStats(organizationId!)
      ]);
      setInstallments(data);
      setStats(statistics);
    } catch (error) {
      console.error('[InstallmentsPage] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (installment: Installment) => {
    setSelectedInstallment(installment);
    setIsModalOpen(true);
  };

  const filteredInstallments = installments.filter(item => {
    const matchesSearch = 
      item.client_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      item.product_name.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pago</span>;
      case 'atrasado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Atrasado</span>;
      case 'pendente':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
      case 'cancelado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Cancelado</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'venda_unica') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">Venda</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-100">Mensalidade</span>;
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Página de Parcelas Híbrida</h1>
          <p className="text-slate-500 mt-1">Acompanhamento unificado de vendas únicas e mensalidades recorrentes.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={loadData}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Receita Total (Mês)</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-24" /> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.total_valor || 0)}
            </h3>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-purple-50 rounded-lg">
            <RefreshCw className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">MRR (Mensalidades)</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-24" /> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.mrr || 0)}
            </h3>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor em Atraso</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-24" /> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.valor_atrasado || 0)}
            </h3>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <Tag className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total de Itens</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-16" /> : stats?.total_itens || 0}
            </h3>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente ou produto..."
              className="pl-10"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="todos">Todos os tipos</option>
              <option value="venda_unica">Vendas Únicas</option>
              <option value="mensalidade">Mensalidades</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="atrasado">Atrasados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente / Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parcela / Referência</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24 mt-1" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredInstallments.length > 0 ? (
                filteredInstallments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.client_name}</div>
                      <div className="text-sm text-slate-500">{item.product_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {item.type === 'venda_unica' ? `Parcela #${item.installment_number}` : 'Mensalidade'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex flex-col">
                        <span>{new Date(item.due_date).toLocaleDateString('pt-BR')}</span>
                        {item.status === 'atrasado' && (
                          <span className="text-xs text-red-600 font-medium">
                            {item.days_overdue} {item.days_overdue === 1 ? 'dia' : 'dias'} de atraso
                          </span>
                        )}
                        {item.paid_date && (
                          <span className="text-xs text-green-600">
                            Pago em: {new Date(item.paid_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200"
                      >
                        {item.type === 'venda_unica' ? 'Editar' : 'Dar Baixa'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhum item encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {selectedInstallment && (
        <InstallmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInstallment(null);
          }}
          installment={selectedInstallment}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
