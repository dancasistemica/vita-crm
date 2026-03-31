import { useState, useEffect, useMemo } from 'react';
import { X, Loader, ChevronRight, Check, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSubscription } from '@/services/subscriptionService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/ds/';
import { Input } from '@/components/ui/ds/Input';
import { Card } from '@/components/ui/ds/Card';
import { Select } from '@/components/ui/ds/Select';
import { Badge } from '@/components/ui/ds/Badge';

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
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card variant="elevated" padding="none" className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-neutral-50 border-b border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Nova Mensalidade</h2>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="h-8 w-8 p-0">
              <X className="w-5 h-5 text-neutral-600" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            {Array.from({ length: totalPhases }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i + 1 < currentPhase ? 'bg-success-600 text-white' : i + 1 === currentPhase ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {i + 1 < currentPhase ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < totalPhases - 1 && (
                  <div className={`flex-1 h-1 mx-1 transition-all ${i + 1 < currentPhase ? 'bg-success-600' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-600 mt-2 font-medium">Fase {currentPhase} de {totalPhases}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FASE 1: Cliente */}
            {currentPhase === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">1</Badge>
                  Selecione o Cliente/Lead
                </h3>
                {loadingData ? (
                  <div className="flex items-center justify-center p-4"><Loader className="w-5 h-5 animate-spin text-primary-600" /></div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => setShowClientDropdown(true)}
                      icon={<Search className="w-5 h-5" />}
                    />
                    {showClientDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                          <div className="p-4 text-center text-neutral-500">Nenhum cliente encontrado</div>
                        ) : (
                          filteredClients.map((client) => (
                            <Button variant="secondary" size="sm" key={client.id} type="button"
                              onClick={() => { setFormData({ ...formData, client_id: client.id }); setClientSearch(client.name); setShowClientDropdown(false); }}
                              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0">
                              <p className="font-medium text-neutral-900">{client.name}</p>
                              <p className="text-sm text-neutral-500">{client.email}</p>
                            </Button>
                          ))
                        )}
                      </div>
                    )}
                    {selectedClient && (
                      <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                        <p className="text-sm text-success-700">✅ Cliente: <span className="font-semibold">{selectedClient.name}</span></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FASE 2: Produto */}
            {currentPhase === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">2</Badge>
                  Selecione o Produto
                </h3>
                {loadingData ? (
                  <div className="flex items-center justify-center p-4"><Loader className="w-5 h-5 animate-spin text-primary-600" /></div>
                ) : products.length === 0 ? (
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-warning-700">⚠️ Nenhum produto cadastrado.</div>
                ) : (
                  <Select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value, sales_stage_id: '', monthly_value: 0 })}
                    placeholder="Escolha um produto..."
                    options={products.map(p => ({ value: p.id, label: p.name }))}
                  />
                )}
              </div>
            )}

            {/* FASE 3: Etapa (Valor Mensal) */}
            {currentPhase === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">3</Badge>
                  Selecione a Etapa (Valor Mensal)
                </h3>
                {productSalesStages.filter(s => s.product_id === formData.product_id).length === 0 ? (
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-warning-700">⚠️ Nenhuma etapa cadastrada para este produto.</div>
                ) : (
                  <div className="space-y-3">
                    {productSalesStages.filter(s => s.product_id === formData.product_id).map((stage) => (
                      <Button variant="secondary" size="sm" key={stage.id} type="button"
                        onClick={() => setFormData({ ...formData, sales_stage_id: stage.id, monthly_value: stage.value })}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          formData.sales_stage_id === stage.id ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
                        }`}>
                        <p className="font-semibold text-neutral-900">{stage.name}</p>
                        <p className="text-lg font-bold text-primary-600">R$ {stage.value.toFixed(2)}/mês</p>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FASE 4: Forma de Pagamento */}
            {currentPhase === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">4</Badge>
                  Forma de Pagamento
                </h3>
                {activePaymentMethods.length === 0 ? (
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-warning-700">⚠️ Nenhuma forma de pagamento cadastrada.</div>
                ) : (
                  <Select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    placeholder="Escolha a forma de pagamento..."
                    options={activePaymentMethods.map(m => ({ value: m.id, label: m.name }))}
                  />
                )}
              </div>
            )}

            {/* FASE 5: Data de Início e 1ª Parcela */}
            {currentPhase === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">5</Badge>
                  Datas da Mensalidade
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Data de Início *"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                  <Input
                    label="Vencimento da 1ª Parcela *"
                    type="date"
                    value={formData.first_payment_due_date}
                    onChange={(e) => setFormData({ ...formData, first_payment_due_date: e.target.value })}
                  />
                </div>
                <p className="text-sm text-neutral-600">
                  Valor mensal: <span className="font-bold text-primary-600">R$ {formData.monthly_value.toFixed(2)}</span>
                </p>
              </div>
            )}

            {/* FASE 6: Data Final (opcional) */}
            {currentPhase === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">6</Badge>
                  Data Final (Opcional)
                </h3>
                <p className="text-sm text-neutral-500">
                  Deixe em branco para mensalidade por tempo indeterminado.
                </p>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            )}

            {/* FASE 7: Baixa Automática */}
            {currentPhase === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">7</Badge>
                  Configuração de Pagamento
                </h3>
                <Card padding="md" variant="default" className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Baixa Automática</p>
                    <p className="text-xs text-neutral-500">Marcar mensalidade como paga automaticamente no vencimento</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.auto_payment_enabled}
                    onChange={(e) => setFormData({ ...formData, auto_payment_enabled: e.target.checked })}
                    className="w-5 h-5 accent-primary-600"
                  />
                </Card>
              </div>
            )}

            {/* FASE 8: Notas */}
            {currentPhase === 8 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-700">
                  <Badge variant="default" size="md">8</Badge>
                  Notas Adicionais
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações importantes..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
                />

                <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-700">
                    <ShieldCheck className="w-5 h-5 text-success-600" />
                    Resumo Final
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-neutral-500">Cliente:</span>
                    <span className="font-semibold text-neutral-900">{selectedClient?.name}</span>
                    <span className="text-neutral-500">Valor:</span>
                    <span className="font-bold text-primary-600">R$ {formData.monthly_value.toFixed(2)}/mês</span>
                    <span className="text-neutral-500">Início:</span>
                    <span className="font-semibold text-neutral-900">{new Date(formData.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex gap-4">
          <Button variant="secondary" onClick={handlePreviousPhase} disabled={currentPhase === 1 || loading} className="flex-1">
            Anterior
          </Button>
          {currentPhase < totalPhases ? (
            <Button variant="primary" onClick={handleNextPhase} disabled={!canProceedToNextPhase() || loading} className="flex-1">
              Próximo
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} loading={loading} className="flex-1">
              Criar Mensalidade
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
