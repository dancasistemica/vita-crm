import { useState, useEffect, useMemo } from 'react';
import { X, Loader, ChevronRight, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSubscription } from '@/services/subscriptionService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateSubscriptionModalProps {
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

export const CreateSubscriptionModal = ({ isOpen, onClose, onSuccess }: CreateSubscriptionModalProps) => {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSalesStages, setProductSalesStages] = useState<ProductSalesStage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; active: boolean }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [currentPhase, setCurrentPhase] = useState(1);
  const totalPhases = 8;

  const [formData, setFormData] = useState({
    client_id: '',
    product_id: '',
    sales_stage_id: '',
    monthly_value: 0,
    payment_method_id: '',
    start_date: '',
    end_date: '',
    first_payment_due_date: '',
    auto_payment_enabled: true,
    notes: '',
  });

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

  useEffect(() => {
    if (isOpen && organization?.id) {
      loadAllData();
    }
  }, [isOpen, organization?.id]);

  const loadAllData = async () => {
    if (!organization?.id) return;
    try {
      setLoadingData(true);

      const [clientsRes, productsRes, paymentRes, stagesRes] = await Promise.all([
        supabase.from('leads').select('id, name, email').eq('organization_id', organization.id).order('name'),
        supabase.from('products').select('id, name').eq('organization_id', organization.id).order('name'),
        supabase.from('payment_methods').select('id, name, active').eq('organization_id', organization.id).order('sort_order'),
        supabase.from('product_sales_stages').select('id, product_id, name, value, products!inner(id, name, organization_id)').eq('products.organization_id', organization.id),
      ]);

      setClients(clientsRes.data || []);
      setProducts(productsRes.data || []);
      setPaymentMethods(paymentRes.data || []);

      const mappedStages: ProductSalesStage[] = (stagesRes.data || []).map((stage: any) => ({
        id: stage.id,
        product_id: stage.product_id,
        product_name: stage.products?.name || '',
        name: stage.name,
        value: Number(stage.value) || 0,
      }));
      setProductSalesStages(mappedStages);
    } catch (error) {
      console.error('[CreateSubscriptionModal] Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const canProceedToNextPhase = () => {
    switch (currentPhase) {
      case 1: return formData.client_id !== '';
      case 2: return formData.product_id !== '';
      case 3: return formData.sales_stage_id !== '';
      case 4: return formData.payment_method_id !== '';
      case 5: return formData.start_date !== '' && formData.first_payment_due_date !== '';
      case 6: return true; // end_date is optional
      case 7: return true; // auto_payment config
      case 8: return true; // notes
      default: return false;
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
    if (currentPhase > 1) setCurrentPhase(currentPhase - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || !formData.client_id || !formData.product_id || !formData.sales_stage_id || !formData.payment_method_id || !formData.start_date || !formData.first_payment_due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await createSubscription(organization.id, {
        client_id: formData.client_id,
        product_id: formData.product_id,
        sales_stage_id: formData.sales_stage_id,
        monthly_value: formData.monthly_value,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        payment_method_id: formData.payment_method_id,
        auto_payment_enabled: formData.auto_payment_enabled,
        notes: formData.notes,
        first_payment_due_date: formData.first_payment_due_date,
      });

      toast.success('Mensalidade criada com sucesso!');
      setFormData({
        client_id: '', product_id: '', sales_stage_id: '', monthly_value: 0,
        payment_method_id: '', start_date: '', end_date: '', first_payment_due_date: '',
        auto_payment_enabled: true, notes: '',
      });
      setClientSearch('');
      setCurrentPhase(1);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('[CreateSubscriptionModal] Erro:', error);
      toast.error('Erro ao criar mensalidade');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedClient = clients.find(c => c.id === formData.client_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-b border-purple-200 dark:border-purple-700 p-4 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Nova Mensalidade</h2>
            <button onClick={onClose} disabled={loading} className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors">
              <X className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPhases }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i + 1 < currentPhase ? 'bg-green-500 text-white' : i + 1 === currentPhase ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {i + 1 < currentPhase ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < totalPhases - 1 && (
                  <div className={`flex-1 h-1 mx-1 transition-all ${i + 1 < currentPhase ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">Fase {currentPhase} de {totalPhases}</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* FASE 1: Cliente */}
          {currentPhase === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Selecione o Cliente/Lead
              </h3>
              {loadingData ? (
                <div className="flex items-center justify-center p-4"><Loader className="w-5 h-5 animate-spin text-purple-600" /></div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Buscar por nome ou email..." value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                    />
                  </div>
                  {showClientDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Nenhum cliente encontrado</div>
                      ) : (
                        filteredClients.map((client) => (
                          <button key={client.id} type="button"
                            onClick={() => { setFormData({ ...formData, client_id: client.id }); setClientSearch(client.name); setShowClientDropdown(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-b border-gray-200 last:border-b-0">
                            <p className="font-medium text-foreground">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">✅ Cliente: <span className="font-semibold">{selectedClient.name}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FASE 2: Produto */}
          {currentPhase === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Selecione o Produto
              </h3>
              {loadingData ? (
                <div className="flex items-center justify-center p-4"><Loader className="w-5 h-5 animate-spin" /></div>
              ) : products.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">⚠️ Nenhum produto cadastrado.</div>
              ) : (
                <select value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value, sales_stage_id: '', monthly_value: 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base">
                  <option value="">Escolha um produto...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* FASE 3: Etapa (Valor Mensal) */}
          {currentPhase === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Selecione a Etapa (Valor Mensal)
              </h3>
              {productSalesStages.filter(s => s.product_id === formData.product_id).length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">⚠️ Nenhuma etapa cadastrada para este produto.</div>
              ) : (
                <div className="space-y-3">
                  {productSalesStages.filter(s => s.product_id === formData.product_id).map((stage) => (
                    <button key={stage.id} type="button"
                      onClick={() => setFormData({ ...formData, sales_stage_id: stage.id, monthly_value: stage.value })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        formData.sales_stage_id === stage.id ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                      }`}>
                      <p className="font-semibold text-foreground">{stage.name}</p>
                      <p className="text-lg font-bold text-purple-600">R$ {stage.value.toFixed(2)}/mês</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FASE 4: Forma de Pagamento */}
          {currentPhase === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                Forma de Pagamento
              </h3>
              {activePaymentMethods.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">⚠️ Nenhuma forma de pagamento cadastrada.</div>
              ) : (
                <select value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base">
                  <option value="">Escolha a forma de pagamento...</option>
                  {activePaymentMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* FASE 5: Data de Início e 1ª Parcela */}
          {currentPhase === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                Datas da Mensalidade
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data de Início *</label>
                  <input type="date" value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Vencimento da 1ª Parcela *</label>
                  <input type="date" value={formData.first_payment_due_date}
                    onChange={(e) => setFormData({ ...formData, first_payment_due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Valor mensal: <span className="font-bold text-purple-600">R$ {formData.monthly_value.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* FASE 6: Data Final (opcional) */}
          {currentPhase === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
                Data Final (Opcional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Deixe em branco para mensalidade por tempo indeterminado.
              </p>
              <input type="date" value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              />
            </div>
          )}

          {/* FASE 7: Baixa Automática */}
          {currentPhase === 7 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
                Configuração de Pagamento
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.auto_payment_enabled}
                    onChange={(e) => setFormData({ ...formData, auto_payment_enabled: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-1"
                  />
                  <div>
                    <p className="font-semibold text-foreground">Baixa Automática no Vencimento</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O sistema marcará automaticamente como pago na data de vencimento.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* FASE 8: Observações + Resumo */}
          {currentPhase === 8 && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
                Observações (Opcional)
              </h3>
              <textarea value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione observações sobre esta mensalidade..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              />
              {/* Resumo */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">Resumo da Mensalidade</h4>
                <div className="text-sm space-y-1 text-foreground">
                  <p>Cliente: <span className="font-semibold">{selectedClient?.name}</span></p>
                  <p>Valor Mensal: <span className="font-semibold text-purple-600">R$ {formData.monthly_value.toFixed(2)}</span></p>
                  <p>Início: <span className="font-semibold">{formData.start_date}</span></p>
                  <p>1º Vencimento: <span className="font-semibold">{formData.first_payment_due_date}</span></p>
                  {formData.end_date && <p>Término: <span className="font-semibold">{formData.end_date}</span></p>}
                  {!formData.end_date && <p>Término: <span className="font-semibold text-green-600">Indeterminado</span></p>}
                  <p>Baixa Automática: <span className="font-semibold">{formData.auto_payment_enabled ? 'Ativada ✅' : 'Desativada ❌'}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-6 border-t">
            <button type="button" onClick={handlePreviousPhase} disabled={currentPhase === 1 || loading}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 font-medium">
              ← Anterior
            </button>
            {currentPhase < totalPhases ? (
              <button type="button" onClick={handleNextPhase} disabled={!canProceedToNextPhase() || loading}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2">
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2">
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Criar Mensalidade
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
