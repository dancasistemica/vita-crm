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
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import InstallmentModal from '@/components/InstallmentModal';

export default function InstallmentsPage() {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, statistics] = await Promise.all([
        getInstallments(organizationId!),
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
      item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Acompanhamento de Parcelas</h1>
          <p className="text-slate-500 mt-1">Gerencie e monitore as mensalidades e pagamentos dos seus clientes.</p>
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
            <p className="text-sm font-medium text-slate-500">Total Recebido</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-24" /> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.valor_pago || 0)}
            </h3>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pendente</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-24" /> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.valor_pendente || 0)}
            </h3>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Atrasados</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-12" /> : stats?.parcelas_atrasadas || 0}
            </h3>
            <p className="text-xs text-red-600 mt-1 font-medium">Inadimplência detectada</p>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Taxa de Liquidez</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.total_parcelas ? Math.round((stats.parcelas_pagas / stats.total_parcelas) * 100) : 0}%`}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parcela</th>
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
                    <td className="px-6 py-4"><Skeleton className="h-5 w-12" /></td>
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
                      <span className="text-sm text-slate-600">Parcela #{item.installment_number}</span>
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
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma parcela encontrada para os filtros aplicados.
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
