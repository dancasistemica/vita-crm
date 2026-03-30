import { useState, useEffect } from 'react';
import { X, Loader, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getSaleById, updateSale } from '@/services/saleService';
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
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [saleData, setSaleData] = useState<any>(null);

  const [formData, setFormData] = useState({
    payment_method_id: sale.payment_method_id || '',
    status: sale.status || '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && organization?.id && sale?.id) {
      loadSaleData();
      loadPaymentMethods();
    }
  }, [isOpen, organization?.id, sale?.id]);

  const loadSaleData = async () => {
    if (!sale?.id) return;

    try {
      setLoadingData(true);
      console.log('[EditSaleModal] Carregando dados da venda:', sale.id);

      const data = await getSaleById(sale.id, sale.sale_type);

      if (!data) {
        console.error('[EditSaleModal] ❌ Venda não encontrada');
        toast.error('Venda não encontrada');
        onClose();
        return;
      }

      setSaleData(data);
      setFormData({
        payment_method_id: data.payment_method_id || sale.payment_method_id,
        status: data.status || sale.status,
        notes: data.notes || '',
      });

      console.log('[EditSaleModal] ✅ Dados da venda carregados');
    } catch (error) {
      console.error('[EditSaleModal] ❌ Erro ao carregar venda:', error);
      toast.error('Erro ao carregar venda');
      onClose();
    } finally {
      setLoadingData(false);
    }
  };

  const loadPaymentMethods = async () => {
    if (!organization?.id) return;

    try {
      console.log('[EditSaleModal] Carregando formas de pagamento');

      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setPaymentMethods(data || []);
      console.log('[EditSaleModal] ✅ Formas de pagamento carregadas:', data?.length || 0);
    } catch (error) {
      console.error('[EditSaleModal] ❌ Erro ao carregar formas de pagamento:', error);
      toast.error('Erro ao carregar formas de pagamento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.payment_method_id && sale.sale_type === 'mensalidade') {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    setLoading(true);
    try {
      console.log('[EditSaleModal] Atualizando venda:', {
        saleId: sale.id,
        saleType: sale.sale_type,
        payment_method_id: formData.payment_method_id,
        status: formData.status,
      });

      await updateSale(sale.id, sale.sale_type, {
        payment_method_id: formData.payment_method_id,
        status: formData.status,
        notes: formData.notes,
      });

      toast.success('Venda atualizada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('[EditSaleModal] ❌ Erro ao atualizar venda:', error);
      toast.error('Erro ao atualizar venda');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados da venda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!saleData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="text-center">
            <p className="text-red-600 font-semibold">❌ Venda não encontrada</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 flex items-center justify-between">
          <h2 className="font-bold text-blue-900">Editar Venda</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-blue-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
              <option value="atrasado">Atrasado</option>
              <option value="ativo">Ativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
            <select
              value={formData.payment_method_id}
              onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma forma de pagamento</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adicione observações sobre esta venda..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSaleModal;
