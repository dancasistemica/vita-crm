import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, ChevronDown, Calendar, CreditCard, User, Tag, ArrowUpRight, DollarSign, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { CreateSaleModal } from '@/components/sales/CreateSaleModal';
import EditSaleModal from '@/components/sales/EditSaleModal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { deleteSale } from '@/services/salesService';
import { deleteSubscription } from '@/services/subscriptionService';

interface Sale {
  id: string;
  client_id: string;
  client_name: string;
  sales_stage_id: string;
  stage_name: string;
  stage_value: number;
  sale_type: 'unica' | 'mensalidade';
  payment_method_id: string;
  payment_method_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const VendasPage = () => {
  const { organization } = useOrganization();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState<'todos' | 'unica' | 'mensalidade'>('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  useEffect(() => {
    if (organization?.id) {
      loadSales();
    }
  }, [organization?.id]);

  const loadSales = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      console.log('[VendasPage] Carregando vendas para org:', organization.id);

      // Query para vendas únicas
      const { data: uniqueSalesData, error: uniqueSalesError } = await supabase
        .from('sales')
        .select(`
          id,
          lead_id,
          leads(name),
          product_id,
          product_sales_stages(name, value, sale_type),
          payment_method,
          status,
          created_at,
          updated_at
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (uniqueSalesError) throw uniqueSalesError;

      // Query para mensalidades
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          client_id,
          leads(name),
          sales_stage_id,
          product_sales_stages(name, value, sale_type),
          monthly_value,
          payment_method_id,
          payment_methods(name),
          status,
          created_at,
          updated_at
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Transformar dados para formato unificado
      const formattedUniqueSales = (uniqueSalesData || []).map((sale: any) => ({
        id: sale.id,
        client_id: sale.lead_id,
        client_name: sale.leads?.name || 'Cliente desconhecido',
        sales_stage_id: sale.product_id,
        stage_name: sale.product_sales_stages?.name || 'Etapa desconhecida',
        stage_value: sale.product_sales_stages?.value || 0,
        sale_type: 'unica' as const,
        payment_method_id: sale.payment_method,
        payment_method_name: sale.payment_method || 'Não definida',
        status: sale.status,
        created_at: sale.created_at,
        updated_at: sale.updated_at,
      }));

      const formattedSubscriptions = (subscriptionsData || []).map((sub: any) => ({
        id: sub.id,
        client_id: sub.client_id,
        client_name: sub.leads?.name || 'Cliente desconhecido',
        sales_stage_id: sub.sales_stage_id,
        stage_name: sub.product_sales_stages?.name || 'Etapa desconhecida',
        stage_value: sub.monthly_value || 0,
        sale_type: 'mensalidade' as const,
        payment_method_id: sub.payment_method_id,
        payment_method_name: sub.payment_methods?.name || 'Não definida',
        status: sub.status,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
      }));

      const allSales = [...formattedUniqueSales, ...formattedSubscriptions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('[VendasPage] ✅ Vendas carregadas:', allSales.length);
      setSales(allSales);
    } catch (error) {
      console.error('[VendasPage] ❌ Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.stage_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSaleType = saleTypeFilter === 'todos' || sale.sale_type === saleTypeFilter;
      const matchesStatus = statusFilter === 'todos' || sale.status === statusFilter;

      return matchesSearch && matchesSaleType && matchesStatus;
    });
  }, [sales, searchTerm, saleTypeFilter, statusFilter]);

  const handleEditSale = (saleId: string) => {
    console.log('[VendasPage] Abrindo modal de edição para venda:', saleId);
    setSelectedSaleId(saleId);
    setShowEditModal(true);
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (!confirm(`Tem certeza que deseja excluir esta venda de ${sale.client_name}?`)) return;

    try {
      if (sale.sale_type === 'unica') {
        await deleteSale(sale.id);
      } else {
        await deleteSubscription(sale.id);
      }

      toast.success('Venda excluída com sucesso');
      setSales(sales.filter(s => s.id !== sale.id));
    } catch (error) {
      console.error('[VendasPage] ❌ Erro ao excluir venda:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pago') || s.includes('ativ') || s.includes('concluid')) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> {status}
        </span>
      );
    }
    if (s.includes('pendent') || s.includes('esper')) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" /> {status}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
        <AlertCircle className="w-3 h-3" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vendas</h1>
            <p className="text-gray-500 mt-1">Gerencie todas as suas vendas e mensalidades em um só lugar.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Venda
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSaleTypeFilter('todos')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${saleTypeFilter === 'todos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSaleTypeFilter('unica')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${saleTypeFilter === 'unica' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Únicas
                </button>
                <button
                  onClick={() => setSaleTypeFilter('mensalidade')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${saleTypeFilter === 'mensalidade' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Mensalidades
                </button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="todos">Todos os Status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="cancelada">Cancelada</option>
                <option value="atrasado">Atrasado</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-lg border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title="Mais filtros"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Carregando suas vendas...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhuma venda encontrada</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Não encontramos nenhuma venda com os filtros aplicados. Tente ajustar sua busca ou criar uma nova venda.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 text-blue-600 font-semibold hover:underline"
            >
              Criar minha primeira venda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Informações Principais */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${sale.sale_type === 'unica' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {sale.sale_type === 'unica' ? <Package className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{sale.client_name}</h3>
                        {getStatusBadge(sale.status)}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${sale.sale_type === 'unica' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                          {sale.sale_type === 'unica' ? 'Venda Única' : 'Mensalidade'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-4 h-4" />
                          <span>{sale.stage_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" />
                          <span>{sale.payment_method_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(sale.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Valor Total</p>
                      <p className="text-xl font-extrabold text-gray-900">
                        {sale.stage_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {sale.sale_type === 'mensalidade' && <span className="text-xs font-normal text-gray-400 ml-1">/mês</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSale(sale.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      <CreateSaleModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={loadSales}
      />
      
      {showEditModal && selectedSaleId && (
        <EditSaleModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          saleId={selectedSaleId}
        />
      )}
    </div>
  );
};

export default VendasPage;
