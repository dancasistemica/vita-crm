import { Alert, Button } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { X, Loader, Check, AlertCircle, RefreshCw, Trash2, Info, DollarSign, Percent } from 'lucide-react';
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [saleData, setSaleData] = useState<any>(null);

  const [formData, setFormData] = useState({
    payment_method_id: sale?.payment_method_id || '',
    status: sale?.status || '',
    notes: '',
    discount_type: sale?.discount_type || 'none',
    discount_value: sale?.discount_value || 0,
    discount_description: sale?.discount_description || '',
    original_amount: sale?.original_amount || sale?.stage_value || 0,
    final_amount: sale?.final_amount || sale?.stage_value || 0,
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
        discount_type: data.discount_type || 'none',
        discount_value: data.discount_value || 0,
        discount_description: data.discount_description || '',
        original_amount: data.original_amount || data.value || 0,
        final_amount: data.final_amount || data.value || 0,
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
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        discount_description: formData.discount_description,
        original_amount: formData.original_amount,
        final_amount: formData.final_amount,
        value: formData.final_amount, // Atualiza o valor principal também
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

  const handleDeleteSale = async () => {
    if (!confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeleting(true);
    try {
      console.log('[EditSaleModal] Deletando venda:', sale.id);

      await deleteSale(sale.id, sale.sale_type);

      console.log('[EditSaleModal] ✅ Venda deletada com sucesso');
      toast.success('Venda deletada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar venda';
      console.error('[EditSaleModal] ❌ Erro ao deletar:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Editar Venda</h2>
            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              {sale.sale_type === 'unica' ? 'Venda Única' : 'Mensalidade'}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-neutral-500 font-medium">Carregando informações...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-700">Erro ao carregar</h3>
              <p className="text-neutral-600 text-sm mb-6 px-4">{error}</p>
              <div className="flex flex-col gap-3">
                <Button variant="secondary" size="sm"
                  onClick={loadData}
                  className="flex items-center justify-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Tentar Novamente
                </Button>
                <Button variant="secondary" size="sm"
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info do Cliente (ReadOnly) */}
              <div className="bg-neutral-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Cliente</p>
                <p className="text-neutral-900 font-semibold">{sale?.client_name || 'Cliente'}</p>
                <p className="text-xs text-neutral-500">{sale?.stage_name || ''}{sale?.stage_value != null ? ` • ${sale.stage_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5 flex items-center gap-3">
                  Status da Venda
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
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
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5 flex items-center gap-3">
                  Forma de Pagamento
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
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
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Adicione detalhes importantes sobre esta venda..."
                />
              </div>

              {/* Seção de Desconto */}
              {sale.sale_type === 'unica' && (
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-neutral-700">Desconto</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Tipo</label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">Sem desconto</option>
                        <option value="fixed">Fixo (R$)</option>
                        <option value="percentage">Percentual (%)</option>
                      </select>
                    </div>

                    {formData.discount_type !== 'none' && (
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                          {formData.discount_type === 'fixed' ? 'Valor (R$)' : 'Valor (%)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
                            {formData.discount_type === 'fixed' ? 'R$' : '%'}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.discount_value}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const original = formData.original_amount;
                              let final = original;
                              if (formData.discount_type === 'fixed') {
                                final = original - val;
                              } else {
                                final = original - (original * val / 100);
                              }
                              setFormData({
                                ...formData,
                                discount_value: val,
                                final_amount: Math.max(0, final)
                              });
                            }}
                            className="w-full pl-6 pr-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.discount_type !== 'none' && (
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Motivo</label>
                      <input
                        type="text"
                        value={formData.discount_description}
                        onChange={(e) => setFormData({ ...formData, discount_description: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Motivo do desconto..."
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Valor Final:</span>
                    <span className="text-lg font-bold text-blue-900">
                      R$ {formData.final_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-4">
                {/* Botão Excluir */}
                <Button variant="secondary" size="sm"
                  type="button"
                  onClick={handleDeleteSale}
                  disabled={loading || deleting}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-3 order-3 sm:order-1"
                  title="Excluir esta venda"
                >
                  {deleting && <Loader className="w-4 h-4 animate-spin" />}
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </Button>

                {/* Botões Cancelar e Salvar */}
                <div className="flex gap-3 flex-1 order-1 sm:order-2">
                  <Button variant="secondary" size="sm"
                    type="button"
                    onClick={onClose}
                    disabled={loading || deleting}
                    className="flex-1 px-4 py-2 bg-gray-300 text-neutral-800 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button variant="secondary" size="sm"
                    type="submit"
                    disabled={loading || deleting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-3"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditSaleModal;