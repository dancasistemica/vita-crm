import { useState, useEffect } from 'react';
import { X, Loader, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSaleWithInstallments } from '@/services/salesService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SalesStage {
  id: string;
  product_id: string;
  product_name: string;
  stage_name: string;
  stage_value: number;
}

interface PaymentMethod {
  id: string;
  name: string;
}

export const CreateSaleModal = ({ isOpen, onClose, onSuccess }: CreateSaleModalProps) => {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [salesStages, setSalesStages] = useState<SalesStage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [currentPhase, setCurrentPhase] = useState(1);
  const totalPhases = 8;

  const [formData, setFormData] = useState({
    client_id: '',
    product_id: '',
    sales_stage_id: '',
    stage_value: 0,
    payment_method_id: '',
    initial_payment: 0,
    installments: '1',
    first_payment_date: '',
    auto_payment_enabled: true,
    notes: '',
  });

  useEffect(() => {
    if (isOpen && organization?.id) {
      loadAllData();
    }
  }, [isOpen, organization?.id]);

  const loadAllData = async () => {
    if (!organization?.id) return;

    try {
      setLoadingData(true);
      console.log('[CreateSaleModal] 🔄 Carregando dados iniciais...');

      const { data: clientsData, error: clientsError } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (!clientsError && clientsData) {
        console.log('[CreateSaleModal] ✅ Clientes carregados:', clientsData.length);
        setClients(clientsData);
      } else {
        console.warn('[CreateSaleModal] ⚠️ Erro ao carregar clientes:', clientsError);
      }

      const { data: stagesData, error: stagesError } = await supabase
        .from('sales_stages')
        .select('id, product_id, product_name, stage_name, stage_value')
        .eq('organization_id', organization.id)
        .order('product_name, stage_value', { ascending: true });

      if (!stagesError && stagesData) {
        console.log('[CreateSaleModal] ✅ Etapas de venda carregadas:', stagesData.length);
        setSalesStages(stagesData);
      } else {
        console.warn('[CreateSaleModal] ⚠️ Erro ao carregar etapas:', stagesError);
      }

      const { data: methodsData, error: methodsError } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (!methodsError && methodsData) {
        console.log('[CreateSaleModal] ✅ Formas de pagamento carregadas:', methodsData.length);
        setPaymentMethods(methodsData);
      } else {
        console.warn('[CreateSaleModal] ⚠️ Erro ao carregar formas de pagamento:', methodsError);
      }
    } catch (error) {
      console.error('[CreateSaleModal] ❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const valueToInstall = formData.stage_value - (formData.initial_payment || 0);
  const installmentValue = valueToInstall / parseInt(formData.installments || '1', 10);

  const canProceedToNextPhase = () => {
    switch (currentPhase) {
      case 1:
        return formData.client_id !== '';
      case 2:
        return formData.product_id !== '';
      case 3:
        return formData.sales_stage_id !== '';
      case 4:
        return formData.payment_method_id !== '';
      case 5:
        return formData.initial_payment >= 0 && formData.initial_payment < formData.stage_value;
      case 6:
        return formData.installments !== '' && formData.first_payment_date !== '';
      case 7:
        return true;
      case 8:
        return true;
      default:
        return false;
    }
  };

  const handleNextPhase = () => {
    if (canProceedToNextPhase() && currentPhase < totalPhases) {
      setCurrentPhase(currentPhase + 1);
    } else {
      toast.error('Preencha os campos obrigatórios');
    }
  };

  const handlePreviousPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    if (
      !formData.client_id ||
      !formData.product_id ||
      !formData.sales_stage_id ||
      !formData.payment_method_id ||
      !formData.first_payment_date ||
      !formData.installments ||
      formData.stage_value <= 0 ||
      formData.initial_payment < 0 ||
      formData.initial_payment >= formData.stage_value
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateSaleModal] Criando venda:', {
        client_id: formData.client_id,
        product_id: formData.product_id,
        sales_stage_id: formData.sales_stage_id,
        stage_value: formData.stage_value,
        initial_payment: formData.initial_payment,
        installments: formData.installments,
      });

      await createSaleWithInstallments(organization.id, {
        client_id: formData.client_id,
        value: formData.stage_value,
        status: 'pendente',
        installments: parseInt(formData.installments, 10),
        first_payment_date: formData.first_payment_date,
        auto_payment_enabled: formData.auto_payment_enabled,
        notes: formData.notes,
        payment_method_id: formData.payment_method_id,
        initial_payment: formData.initial_payment,
        sales_stage_id: formData.sales_stage_id,
        items: [
          {
            product_id: formData.product_id,
            quantity: 1,
            unit_price: formData.stage_value,
          },
        ],
      });

      toast.success('Venda criada com sucesso!');

      setFormData({
        client_id: '',
        product_id: '',
        sales_stage_id: '',
        stage_value: 0,
        payment_method_id: '',
        initial_payment: 0,
        installments: '1',
        first_payment_date: '',
        auto_payment_enabled: true,
        notes: '',
      });
      setCurrentPhase(1);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('[CreateSaleModal] ❌ Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-blue-900">Criar Nova Venda</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 hover:bg-blue-200 rounded transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPhases }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i + 1 < currentPhase
                      ? 'bg-green-500 text-white'
                      : i + 1 === currentPhase
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {i + 1 < currentPhase ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < totalPhases - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 transition-all ${
                      i + 1 < currentPhase ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Fase {currentPhase} de {totalPhases}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {currentPhase === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                  Selecione o Cliente/Lead
                </h3>
                {loadingData ? (
                  <div className="flex items-center justify-center p-4 min-h-[44px]">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  >
                    <option value="">Escolha um cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {currentPhase === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                  Selecione o Produto
                </h3>
                {loadingData ? (
                  <div className="flex items-center justify-center p-4 min-h-[44px]">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <select
                    value={formData.product_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        product_id: e.target.value,
                        sales_stage_id: '',
                        stage_value: 0,
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  >
                    <option value="">Escolha um produto...</option>
                    {Array.from(new Map(salesStages.map((stage) => [stage.product_id, stage])).values()).map(
                      (stage) => (
                        <option key={stage.product_id} value={stage.product_id}>
                          {stage.product_name}
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>
            </div>
          )}

          {currentPhase === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                  Selecione a Etapa de Venda
                </h3>
                <div className="space-y-3">
                  {salesStages
                    .filter((stage) => stage.product_id === formData.product_id)
                    .map((stage) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            sales_stage_id: stage.id,
                            stage_value: stage.stage_value,
                          });
                        }}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left min-h-[44px] ${
                          formData.sales_stage_id === stage.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{stage.stage_name}</p>
                        <p className="text-lg font-bold text-blue-600">R$ {stage.stage_value.toFixed(2)}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {currentPhase === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                  Forma de Pagamento
                </h3>
                {loadingData ? (
                  <div className="flex items-center justify-center p-4 min-h-[44px]">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  >
                    <option value="">Escolha a forma de pagamento...</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {currentPhase === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                  Valor de Entrada Inicial
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Valor total da venda: <span className="font-bold text-blue-600">R$ {formData.stage_value.toFixed(2)}</span>
                </p>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.stage_value}
                  value={formData.initial_payment}
                  onChange={(e) => setFormData({ ...formData, initial_payment: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                />
                <p className="text-sm text-gray-600 mt-4">
                  Valor a parcelar: <span className="font-bold text-green-600">R$ {valueToInstall.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          {currentPhase === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
                  Parcelas e Data da 1a Parcela
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nº de Parcelas *</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.installments}
                      onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data da 1a Parcela *</label>
                    <input
                      type="date"
                      value={formData.first_payment_date}
                      onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                    />
                  </div>
                </div>
                {valueToInstall > 0 && formData.installments && (
                  <p className="text-sm text-gray-600 mt-4">
                    Valor da parcela: <span className="font-bold text-blue-600">R$ {installmentValue.toFixed(2)}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {currentPhase === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
                  Configuração de Pagamento
                </h3>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_payment_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_payment_enabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Baixa Automatica no Vencimento</p>
                      <p className="text-sm text-gray-600 mt-1">
                        O sistema marcara automaticamente como pago na data de vencimento. Voce so precisara gerenciar os inadimplentes.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 8 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
                  Observacoes (Opcional)
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Adicione observacoes sobre esta venda..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                />
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Resumo da Venda</h4>
                <div className="text-sm space-y-1">
                  <p>Cliente: <span className="font-semibold">{clients.find((c) => c.id === formData.client_id)?.name}</span></p>
                  <p>Valor Total: <span className="font-semibold text-blue-600">R$ {formData.stage_value.toFixed(2)}</span></p>
                  <p>Entrada: <span className="font-semibold">R$ {formData.initial_payment.toFixed(2)}</span></p>
                  <p>A Parcelar: <span className="font-semibold text-green-600">R$ {valueToInstall.toFixed(2)}</span></p>
                  <p>Parcelas: <span className="font-semibold">{formData.installments}x de R$ {installmentValue.toFixed(2)}</span></p>
                  <p>Baixa Automatica: <span className="font-semibold">{formData.auto_payment_enabled ? 'Ativada ✅' : 'Desativada ❌'}</span></p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handlePreviousPhase}
              disabled={currentPhase === 1 || loading}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 font-medium min-h-[44px]"
            >
              ← Anterior
            </button>

            {currentPhase < totalPhases ? (
              <button
                type="button"
                onClick={handleNextPhase}
                disabled={!canProceedToNextPhase() || loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2 min-h-[44px]"
              >
                Proxima <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Criar Venda
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
