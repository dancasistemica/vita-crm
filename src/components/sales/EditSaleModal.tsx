import { useState, useEffect } from 'react';
import { X, Loader, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getSaleById, updateSale, deleteSale } from '@/services/saleService';
import { toast } from 'sonner';

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

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  sale: Sale;
}

export const EditSaleModal = ({
  isOpen,
  onClose,
  onSuccess,
  sale,
}: EditSaleModalProps) => {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [saleData, setSaleData] = useState<any>(null);

  const [formData, setFormData] = useState({
    payment_method_id: sale?.payment_method_id || '',
    status: sale?.status || '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && sale?.id) {
      console.log('[EditSaleModal] Modal aberto para venda:', {
        saleId: sale.id,
        saleType: sale.sale_type,
        organizationId: organization?.id,
      });
      loadData();
    }
  }, [isOpen, sale?.id, sale?.sale_type, organization?.id]);

  const loadData = async () => {
    setError(null);
    setLoadingData(true);
    try {
      // Carregar em paralelo para ser mais rápido
      await Promise.all([loadSaleData(), loadPaymentMethods()]);
      console.log('[EditSaleModal] ✅ Todos os dados carregados');
    } catch (err) {
      console.error('[EditSaleModal] ❌ Erro no carregamento inicial:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadSaleData = async () => {
    if (!sale?.id || !sale?.sale_type) {
      console.error('[EditSaleModal] ❌ Dados da venda incompletos');
      setError('Dados da venda inválidos');
      return;
    }

    try {
      console.log('[EditSaleModal] Carregando dados detalhados da venda...');
      const data = await getSaleById(sale.id, sale.sale_type);

      if (!data) {
        throw new Error('Venda não encontrada no banco de dados');
      }

      setSaleData(data);
      setFormData({
        payment_method_id: data.payment_method_id || '',
        status: data.status || '',
        notes: data.notes || '',
      });
      console.log('[EditSaleModal] ✅ Venda carregada com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar venda';
      console.error('[EditSaleModal] ❌ Erro ao carregar venda:', errorMessage);
      setError(errorMessage);
      toast.error(`Erro ao carregar venda: ${errorMessage}`);
      throw err;
    }
  };

  const loadPaymentMethods = async () => {
    if (!organization?.id) return;

    try {
      console.log('[EditSaleModal] Carregando formas de pagamento...');
      const { data, error: pmError } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (pmError) throw pmError;

      setPaymentMethods(data || []);
      console.log('[EditSaleModal] ✅ Formas de pagamento carregadas:', data?.length || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar formas de pagamento';
      console.error('[EditSaleModal] ❌ Erro ao carregar formas de pagamento:', errorMessage);
      // Não bloqueia o modal se falhar as formas de pagamento, mas avisa
      toast.error('Não foi possível carregar as formas de pagamento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.status) {
      toast.error('O status é obrigatório');
      return;
    }

    setLoading(true);
    try {
      console.log('[EditSaleModal] Iniciando atualização da venda...', {
        saleId: sale.id,
        saleType: sale.sale_type,
        formData
      });

      await updateSale(sale.id, sale.sale_type, {
        payment_method_id: formData.payment_method_id || null,
        status: formData.status,
        notes: formData.notes,
      });

      toast.success('Venda atualizada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[EditSaleModal] ❌ Erro ao atualizar venda:', errorMessage);
      toast.error(`Erro ao atualizar venda: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-lg">Editar Venda</h2>
            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              {sale.sale_type === 'unica' ? 'Venda Única' : 'Mensalidade'}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 font-medium">Carregando informações...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-gray-600 text-sm mb-6 px-4">{error}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={loadData}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Tentar Novamente
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Info do Cliente (ReadOnly) */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Cliente</p>
                <p className="text-gray-900 font-semibold">{sale?.client_name || 'Cliente'}</p>
                <p className="text-xs text-gray-500">{sale?.stage_name || ''}{sale?.stage_value != null ? ` • ${sale.stage_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  Status da Venda
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Selecione um status</option>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="ativo">Ativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  Forma de Pagamento
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Nenhuma definida</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                {paymentMethods.length === 0 && (
                  <p className="text-[10px] text-yellow-600 mt-1">Nenhuma forma de pagamento cadastrada para a organização.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Adicione detalhes importantes sobre esta venda..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Salvar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditSaleModal;