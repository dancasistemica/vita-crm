import { useState, useEffect, useMemo } from 'react';
import { X, Loader, ChevronRight, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSaleWithInstallments } from '@/services/salesService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProductSalesStage {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  value: number;
}

interface Product {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export const CreateSaleModal = ({ isOpen, onClose, onSuccess }: CreateSaleModalProps) => {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSalesStages, setProductSalesStages] = useState<ProductSalesStage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; active: boolean }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Busca de cliente
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Controle de fase
  const [currentPhase, setCurrentPhase] = useState(1);
  const totalPhases = 8;

  // Form state
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

  // Filtrar clientes por busca
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(
      client =>
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  const activePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => method.active),
    [paymentMethods]
  );

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen && organization?.id) {
      loadAllData();
    }
  }, [isOpen, organization?.id]);

  const loadAllData = async () => {
    if (!organization?.id) return;

    try {
      setLoadingData(true);
      console.log('[CreateSaleModal] Carregando dados para org:', organization.id);

      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (clientsError) {
        console.error('[CreateSaleModal] Erro ao carregar clientes:', clientsError);
      } else {
        console.log('[CreateSaleModal] Clientes carregados:', clientsData?.length || 0);
        setClients(clientsData || []);
      }

      // Carregar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (productsError) {
        console.error('[CreateSaleModal] Erro ao carregar produtos:', productsError);
      } else {
        console.log('[CreateSaleModal] Produtos carregados:', productsData?.length || 0);
        setProducts(productsData || []);
      }

      // Carregar formas de pagamento
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('id, name, active')
        .eq('organization_id', organization.id)
        .order('sort_order', { ascending: true });

      if (paymentMethodsError) {
        console.error('[CreateSaleModal] Erro ao carregar formas de pagamento:', paymentMethodsError);
      } else if (!paymentMethodsData || paymentMethodsData.length === 0) {
        // Seed automático: criar formas de pagamento padrão
        console.log('[CreateSaleModal] Nenhuma forma encontrada, criando padrão...');
        const defaults = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Transferência'];
        const { data: seeded, error: seedError } = await supabase
          .from('payment_methods')
          .insert(defaults.map((name, i) => ({ organization_id: organization.id, name, active: true, sort_order: i })))
          .select('id, name, active');
        if (seedError) {
          console.error('[CreateSaleModal] Erro ao criar formas padrão:', seedError);
        } else {
          console.log('[CreateSaleModal] Formas padrão criadas:', seeded?.length);
          setPaymentMethods(seeded || []);
        }
      } else {
        console.log('[CreateSaleModal] Formas de pagamento carregadas:', paymentMethodsData.length);
        setPaymentMethods(paymentMethodsData);
      }

      // Carregar etapas de venda por produto (product_sales_stages)
      const { data: stagesData, error: stagesError } = await supabase
        .from('product_sales_stages')
        .select('id, product_id, name, value, products!inner(id, name, organization_id)')
        .eq('products.organization_id', organization.id)
        .order('name', { foreignTable: 'products', ascending: true })
        .order('value', { ascending: true });

      if (stagesError) {
        console.error('[CreateSaleModal] Erro ao carregar etapas:', stagesError);
      } else {
        const mappedStages: ProductSalesStage[] = (stagesData || []).map((stage: any) => ({
          id: stage.id,
          product_id: stage.product_id,
          product_name: stage.products?.name || '',
          name: stage.name,
          value: Number(stage.value) || 0,
        }));
        console.log('[CreateSaleModal] Etapas de venda carregadas:', mappedStages.length);
        setProductSalesStages(mappedStages);
      }

    } catch (error) {
      console.error('[CreateSaleModal] Erro crítico ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  // Calcular valor a parcelar
  const valueToInstall = formData.stage_value - (formData.initial_payment || 0);
  const installmentValue = valueToInstall / parseInt(formData.installments || '1');

  // Validar fase atual
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
        return formData.installments && formData.first_payment_date !== '';
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

    if (
      !organization?.id ||
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
        stage_value: formData.stage_value,
        initial_payment: formData.initial_payment,
        installments: formData.installments,
      });

      await createSaleWithInstallments(organization!.id, {
        client_id: formData.client_id,
        value: formData.stage_value,
        status: 'pendente',
        installments: parseInt(formData.installments),
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
      
      // Resetar form
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
      setClientSearch('');
      setCurrentPhase(1);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('[CreateSaleModal] Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedClient = clients.find(c => c.id === formData.client_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header com Progresso */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-blue-900">Criar Nova Venda</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 hover:bg-blue-200 rounded transition-colors"
            >
              <X className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          {/* Progress Bar */}
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

        {/* Conteúdo das Fases */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* FASE 1: Selecionar Cliente com Busca */}
          {currentPhase === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Selecione o Cliente/Lead
              </h3>

              {loadingData ? (
                <div className="flex items-center justify-center p-4">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="relative">
                  {/* Campo de Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou email..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>

                  {/* Dropdown de Clientes */}
                  {showClientDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Nenhum cliente encontrado
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, client_id: client.id });
                              setClientSearch(client.name);
                              setShowClientDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Cliente Selecionado */}
                  {selectedClient && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✅ Cliente selecionado: <span className="font-semibold">{selectedClient.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FASE 2: Selecionar Produto */}
          {currentPhase === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Selecione o Produto
              </h3>

              {loadingData ? (
                <div className="flex items-center justify-center p-4">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : products.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  ⚠️ Nenhum produto cadastrado. Crie produtos nas configurações.
                </div>
              ) : (
                <select
                  value={formData.product_id}
                  onChange={(e) => {
                    setFormData({ ...formData, product_id: e.target.value, sales_stage_id: '' });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="">Escolha um produto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* FASE 3: Selecionar Etapa (Valor) */}
          {currentPhase === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Selecione a Etapa de Venda
              </h3>

              {loadingData ? (
                <div className="flex items-center justify-center p-4">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {productSalesStages
                    .filter(stage => stage.product_id === formData.product_id)
                    .length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                      ⚠️ Nenhuma etapa de venda cadastrada para este produto.
                    </div>
                  ) : (
                    productSalesStages
                      .filter(stage => stage.product_id === formData.product_id)
                      .map((stage) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              sales_stage_id: stage.id,
                              stage_value: stage.value,
                            });
                          }}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            formData.sales_stage_id === stage.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <p className="font-semibold text-gray-900">{stage.name}</p>
                          <p className="text-lg font-bold text-blue-600">R$ {stage.value.toFixed(2)}</p>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* FASE 4: Forma de Pagamento */}
          {currentPhase === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                Forma de Pagamento
              </h3>

              {loadingData ? (
                <div className="flex items-center justify-center p-4">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : activePaymentMethods.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  ⚠️ Nenhuma forma de pagamento cadastrada.
                </div>
              ) : (
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="">Escolha a forma de pagamento...</option>
                  {activePaymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* FASE 5: Valor de Entrada */}
          {currentPhase === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                Valor de Entrada Inicial
              </h3>

              <p className="text-sm text-gray-600">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />

              <p className="text-sm text-gray-600">
                Valor a parcelar: <span className="font-bold text-green-600">R$ {valueToInstall.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* FASE 6: Parcelas e Data */}
          {currentPhase === 6 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
                Parcelas e Data da 1ª Parcela
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nº de Parcelas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da 1ª Parcela *
                  </label>
                  <input
                    type="date"
                    value={formData.first_payment_date}
                    onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
              </div>

              {valueToInstall > 0 && formData.installments && (
                <p className="text-sm text-gray-600">
                  Valor da parcela: <span className="font-bold text-blue-600">R$ {installmentValue.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* FASE 7: Baixa Automática */}
          {currentPhase === 7 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
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
                    <p className="font-semibold text-gray-900">Baixa Automática no Vencimento</p>
                    <p className="text-sm text-gray-600 mt-1">
                      O sistema marcará automaticamente como pago na data de vencimento. Você só precisará gerenciar os inadimplentes.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* FASE 8: Observações */}
          {currentPhase === 8 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
                Observações (Opcional)
              </h3>

              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione observações sobre esta venda..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />

              {/* Resumo da Venda */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Resumo da Venda</h4>
                <div className="text-sm space-y-1">
                  <p>Cliente: <span className="font-semibold">{selectedClient?.name}</span></p>
                  <p>Valor Total: <span className="font-semibold text-blue-600">R$ {formData.stage_value.toFixed(2)}</span></p>
                  <p>Entrada: <span className="font-semibold">R$ {formData.initial_payment.toFixed(2)}</span></p>
                  <p>A Parcelar: <span className="font-semibold text-green-600">R$ {valueToInstall.toFixed(2)}</span></p>
                  <p>Parcelas: <span className="font-semibold">{formData.installments}x de R$ {installmentValue.toFixed(2)}</span></p>
                  <p>Baixa Automática: <span className="font-semibold">{formData.auto_payment_enabled ? 'Ativada ✅' : 'Desativada ❌'}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Navegação */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handlePreviousPhase}
              disabled={currentPhase === 1 || loading}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 font-medium"
            >
              ← Anterior
            </button>

            {currentPhase < totalPhases ? (
              <button
                type="button"
                onClick={handleNextPhase}
                disabled={!canProceedToNextPhase() || loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
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
