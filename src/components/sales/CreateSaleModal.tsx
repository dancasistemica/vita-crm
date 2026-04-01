import { useState, useEffect, useMemo } from 'react';
import { X, Loader, ChevronRight, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSaleWithInstallments } from '@/services/salesService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Alert, Badge, Button, Card, Input, Select } from "@/components/ui/ds";

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
  sale_type: 'unica' | 'mensalidade';
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
  const [saleType, setSaleType] = useState<'unica' | 'mensalidade'>('unica');

  const totalPhases = saleType === 'unica' ? 6 : 7;

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
    start_date: '',
    end_date: '',
    first_payment_due_date: '',
    auto_payment_enabled: true,
    notes: '',
  });

  useEffect(() => {
    if (formData.sales_stage_id) {
      const selectedStage = productSalesStages.find(s => s.id === formData.sales_stage_id);
      if (selectedStage) {
        setSaleType(selectedStage.sale_type);
      }
    }
  }, [formData.sales_stage_id, productSalesStages]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(
      client =>
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  useEffect(() => {
    if (isOpen && organization?.id) {
      loadAllData();
    }
  }, [isOpen, organization?.id]);

  const loadAllData = async () => {
    if (!organization?.id) return;
    try {
      setLoadingData(true);
      const [leadsRes, productsRes, paymentMethodsRes, stagesRes] = await Promise.all([
        supabase.from('leads').select('id, name, email').eq('organization_id', organization.id).order('name'),
        supabase.from('products').select('id, name').eq('organization_id', organization.id).order('name'),
        supabase.from('payment_methods').select('id, name, active').eq('organization_id', organization.id).order('sort_order'),
        supabase.from('product_sales_stages').select('id, product_id, name, value, sale_type, products!inner(id, name, organization_id)').eq('products.organization_id', organization.id)
      ]);

      setClients(leadsRes.data || []);
      setProducts(productsRes.data || []);
      setPaymentMethods(paymentMethodsRes.data || []);
      
      const mappedStages: ProductSalesStage[] = (stagesRes.data || []).map((stage: any) => ({
        id: stage.id,
        product_id: stage.product_id,
        product_name: stage.products?.name || '',
        name: stage.name,
        value: Number(stage.value) || 0,
        sale_type: stage.sale_type || 'unica',
      }));
      setProductSalesStages(mappedStages);

    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const handleNextPhase = () => {
    if (currentPhase < totalPhases) setCurrentPhase(currentPhase + 1);
  };

  const handlePreviousPhase = () => {
    if (currentPhase > 1) setCurrentPhase(currentPhase - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (saleType === 'unica') {
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
          items: [{ product_id: formData.product_id, quantity: 1, unit_price: formData.stage_value }],
        });
        toast.success('Venda criada com sucesso!');
      } else {
        const { createSubscription } = await import('@/services/subscriptionService');
        await createSubscription(organization!.id, {
          client_id: formData.client_id,
          product_id: formData.product_id,
          sales_stage_id: formData.sales_stage_id,
          monthly_value: formData.stage_value,
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
          payment_method_id: formData.payment_method_id,
          auto_payment_enabled: formData.auto_payment_enabled,
          notes: formData.notes,
          first_payment_due_date: formData.first_payment_due_date,
        });
        toast.success('Mensalidade criada com sucesso!');
      }
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao processar a operação');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200">
        {/* Header com Progresso */}
        <div className="p-6 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900">Nova Venda</h2>
            <Button variant="ghost" size="sm" onClick={onClose} icon={<X className="w-5 h-5" />} />
          </div>

          <div className="flex items-center gap-3">
            {Array.from({ length: totalPhases }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                  i + 1 < currentPhase ? 'bg-success-600 border-success-600 text-white' : 
                  i + 1 === currentPhase ? 'bg-primary-600 border-primary-600 text-white' : 
                  'bg-white border-neutral-300 text-neutral-500'
                }`}>
                  {i + 1 < currentPhase ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                {i < totalPhases - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${i + 1 < currentPhase ? 'bg-success-600' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="sale-form" onSubmit={handleSubmit} className="space-y-6">
            {currentPhase === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Input
                  label="Buscar Cliente"
                  placeholder="Nome ou email..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  icon={<Search className="w-5 h-5" />}
                />
                {showClientDropdown && clientSearch && (
                  <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-lg bg-white">
                    {filteredClients.map(client => (
                      <Button variant="secondary" size="sm"
                        key={client.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, client_id: client.id });
                          setClientSearch(client.name);
                          setShowClientDropdown(false);
                        }}
                      >
                        <p className="font-semibold text-neutral-900">{client.name}</p>
                        <p className="text-xs text-neutral-500">{client.email}</p>
                      </Button>
                    ))}
                  </div>
                )}
                {formData.client_id && (
                  <Alert variant="success" title="Cliente Selecionado">
                    O lead foi identificado com sucesso.
                  </Alert>
                )}
              </div>
            )}

            {currentPhase === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Select
                  label="Selecione o Produto"
                  options={products.map(p => ({ value: p.id, label: p.name }))}
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value, sales_stage_id: '' })}
                  placeholder="Escolha um produto..."
                />
              </div>
            )}

            {currentPhase === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Select
                  label="Etapa de Venda"
                  options={productSalesStages.filter(s => s.product_id === formData.product_id).map(s => ({ value: s.id, label: s.name }))}
                  value={formData.sales_stage_id}
                  onChange={(e) => {
                    const stage = productSalesStages.find(s => s.id === e.target.value);
                    setFormData({ ...formData, sales_stage_id: e.target.value, stage_value: stage?.value || 0 });
                  }}
                />
                {formData.stage_value > 0 && (
                  <Card variant="primary" padding="md" className="bg-primary-50 border-primary-100">
                    <p className="text-sm text-primary-700 font-semibold text-center">
                      Valor Previsto: R$ {formData.stage_value.toFixed(2)}
                    </p>
                  </Card>
                )}
              </div>
            )}

            {currentPhase === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Select
                  label="Forma de Pagamento"
                  options={paymentMethods.map(p => ({ value: p.id, label: p.name }))}
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                />
              </div>
            )}

            {currentPhase === 5 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {saleType === 'unica' ? (
                  <>
                    <Input
                      label="Nº Parcelas"
                      type="number"
                      value={formData.installments}
                      onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    />
                    <Input
                      label="Data 1º Vencimento"
                      type="date"
                      value={formData.first_payment_date}
                      onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Início da Vigência"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                    <Input
                      label="1º Pagamento"
                      type="date"
                      value={formData.first_payment_due_date}
                      onChange={(e) => setFormData({ ...formData, first_payment_due_date: e.target.value })}
                    />
                  </>
                )}
              </div>
            )}

            {currentPhase === 6 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Input
                  label="Observações Adicionais"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Algum detalhe importante?"
                />
              </div>
            )}
          </form>
        </div>

        {/* Footer com Ações */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex justify-between gap-4">
          <Button variant="secondary" onClick={handlePreviousPhase} disabled={currentPhase === 1}>
            Voltar
          </Button>
          {currentPhase < totalPhases ? (
            <Button variant="primary" onClick={handleNextPhase}>
              Próximo
            </Button>
          ) : (
            <Button variant="success" type="submit" form="sale-form" loading={loading}>
              Finalizar {saleType === 'unica' ? 'Venda' : 'Assinatura'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
