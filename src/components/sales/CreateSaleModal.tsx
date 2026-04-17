import { Alert, Badge, Button, Card, Input, Select } from "@/components/ui/ds";
import { useState, useEffect, useMemo } from 'react';
import { X, Loader, ChevronRight, Check, Search, ShieldCheck, ArrowLeft, ArrowRight, Info, DollarSign, Percent } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createSale } from '@/services/salesService';
import { createSubscription } from '@/services/subscriptionService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { validatePhase, validateFormComplete, type SaleFormData, type ValidationError } from '@/utils/saleValidation';

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialClientId?: string;
  organizationId: string; // CRÍTICO: Receber como prop obrigatória
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

const INITIAL_FORM_DATA: SaleFormData = {
  client_id: '',
  product_id: '',
  sales_stage_id: '',
  stage_value: 0,
  payment_method_id: '',
  sale_type: 'unica',
  installments: '1',
  sale_date: '',
  first_payment_date: '',
  start_date: '',
  end_date: '',
  first_payment_due_date: '',
  auto_payment_enabled: true,
  notes: '',
  discount_type: 'none',
  discount_value: 0,
  discount_description: '',
  original_amount: 0,
  final_amount: 0,
};

export const CreateSaleModal = ({ isOpen, onClose, onSuccess, initialClientId, organizationId }: CreateSaleModalProps) => {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSalesStages, setProductSalesStages] = useState<ProductSalesStage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; active: boolean }>>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Busca de cliente
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Controle de fase
  const [currentPhase, setCurrentPhase] = useState(1);
  const [formData, setFormData] = useState<SaleFormData>(INITIAL_FORM_DATA);

  // Total de fases dinâmico
  const totalPhases = formData.sale_type === 'unica' ? 6 : 7;

  useEffect(() => {
    const loadModalData = async () => {
      try {
        console.log('[CreateSaleModal] 🔍 Iniciando carregamento de dados');
        console.log('[CreateSaleModal] isOpen:', isOpen);
        console.log('[CreateSaleModal] organizationId recebido:', organizationId);
        console.log('[CreateSaleModal] organizationId é válido?', !!organizationId);
        console.log('');

        // VALIDAÇÃO CRÍTICA
        if (!isOpen) {
          console.log('[CreateSaleModal] ⚠️ Modal não está aberto');
          setLoadingData(false);
          return;
        }

        if (!organizationId || organizationId.trim() === '') {
          console.error('[CreateSaleModal] ❌ ERRO: organizationId não fornecido ou vazio');
          setError('Organization ID não disponível');
          setLoadingData(false);
          return;
        }

        setLoadingData(true);
        setError(null);

        // BUSCA 1: Produtos
        console.log('[CreateSaleModal] 🔍 Buscando produtos...');
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('organization_id', organizationId)
          .order('name');

        if (productsError) {
          console.error('[CreateSaleModal] ❌ ERRO ao buscar produtos:', productsError);
          throw productsError;
        }
        console.log('[CreateSaleModal] ✅ Produtos carregados:', productsData?.length || 0);
        setProducts(productsData || []);
        console.log('');

        // BUSCA 2: Clientes (Leads)
        console.log('[CreateSaleModal] 🔍 Buscando clientes (leads)...');
        const { data: clientsData, error: clientsError } = await supabase
          .from('leads')
          .select('id, name, email')
          .eq('organization_id', organizationId)
          .order('name');

        if (clientsError) {
          console.error('[CreateSaleModal] ❌ ERRO ao buscar clientes:', clientsError);
          throw clientsError;
        }
        console.log('[CreateSaleModal] ✅ Clientes carregados:', clientsData?.length || 0);
        setClients(clientsData || []);
        console.log('');

        // BUSCA 3: Métodos de Pagamento
        console.log('[CreateSaleModal] 🔍 Buscando métodos de pagamento...');
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_methods')
          .select('id, name, active')
          .eq('organization_id', organizationId)
          .order('sort_order');

        if (paymentError) {
          console.error('[CreateSaleModal] ❌ ERRO ao buscar métodos de pagamento:', paymentError);
          throw paymentError;
        }
        console.log('[CreateSaleModal] ✅ Métodos de pagamento carregados:', paymentData?.length || 0);
        setPaymentMethods(paymentData || []);
        console.log('');

        // BUSCA 4: Etapas de Vendas (Específico do projeto)
        console.log('[CreateSaleModal] 🔍 Buscando etapas de vendas...');
        const { data: stagesData, error: stagesError } = await supabase
          .from('product_sales_stages')
          .select('id, product_id, name, value, sale_type, products!inner(id, name, organization_id)')
          .eq('products.organization_id', organizationId);

        if (stagesError) {
          console.error('[CreateSaleModal] ❌ ERRO ao buscar etapas de vendas:', stagesError);
          throw stagesError;
        }
        
        const mappedStages: ProductSalesStage[] = (stagesData || []).map((stage: any) => ({
          id: stage.id,
          product_id: stage.product_id,
          product_name: stage.products?.name || '',
          name: stage.name,
          value: Number(stage.value) || 0,
          sale_type: stage.sale_type || 'unica',
        }));
        
        console.log('[CreateSaleModal] ✅ Etapas de vendas carregadas:', mappedStages.length);
        setProductSalesStages(mappedStages);
        console.log('');

        if (initialClientId) {
          setFormData(prev => ({ ...prev, client_id: initialClientId }));
        }

        console.log('[CreateSaleModal] ✅ Todos os dados carregados com sucesso');
        setLoadingData(false);

      } catch (err) {
        console.error('[CreateSaleModal] ❌ ERRO crítico ao carregar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setLoadingData(false);
      }
    };

    loadModalData();
  }, [isOpen, organizationId, organization?.id, initialClientId]);

  // Sincronizar nome do cliente se o initialClientId mudar
  useEffect(() => {
    if (formData.client_id && clients.length > 0) {
      const client = clients.find(c => c.id === formData.client_id);
      if (client) setClientSearch(client.name);
    }
  }, [formData.client_id, clients]);

  // Recalcular valores quando amount ou desconto mudam
  useEffect(() => {
    const originalAmount = formData.stage_value || 0;
    let discountAmount = 0;
    let finalAmount = originalAmount;

    if (formData.discount_type !== 'none' && formData.discount_value) {
      const discountValue = formData.discount_value || 0;

      if (formData.discount_type === 'fixed') {
        discountAmount = Math.min(discountValue, originalAmount);
        finalAmount = originalAmount - discountAmount;
      } else if (formData.discount_type === 'percentage') {
        if (discountValue > 100) {
          discountAmount = originalAmount;
          finalAmount = 0;
        } else {
          discountAmount = (originalAmount * discountValue) / 100;
          finalAmount = originalAmount - discountAmount;
        }
      }
    }

    if (formData.original_amount !== originalAmount || formData.final_amount !== finalAmount) {
      setFormData(prev => ({
        ...prev,
        original_amount: originalAmount,
        final_amount: Math.max(0, finalAmount)
      }));
    }
  }, [formData.stage_value, formData.discount_type, formData.discount_value]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(
      client =>
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  const handleNextPhase = () => {
    const errors = validatePhase(formData, currentPhase, formData.sale_type);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors[0].message);
      return;
    }

    setValidationErrors([]);
    if (currentPhase < totalPhases) {
      setCurrentPhase(currentPhase + 1);
    }
  };

  const handlePreviousPhase = () => {
    if (currentPhase > 1) setCurrentPhase(currentPhase - 1);
  };

  const isDateInPast = (date: string) => {
    if (!date) return false;
    const selectedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[CreateSaleModal] 🔘 Botão "Finalizar e Salvar" clicado');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[CreateSaleModal] Timestamp:', new Date().toISOString());
    console.log('[CreateSaleModal] Modo:', formData.sale_type);
    console.log('[CreateSaleModal] Form Data:', JSON.stringify(formData, null, 2));
    console.log('');

    const errors = validateFormComplete(formData, formData.sale_type);
    if (errors.length > 0) {
      console.error('[CreateSaleModal] ❌ Validação falhou:', errors);
      setValidationErrors(errors);
      toast.error('Por favor, corrija os erros antes de finalizar');
      return;
    }

    const organizationId = organizationId || organization?.id;
    if (!organizationId) {
      setError('Organização não identificada.');
      return;
    }

    setLoading(true);

    try {
      // PASSO 1 - Adicionar Validação de product_id
      // Validar se product_id existe na tabela products
      console.log('[CreateSaleModal] 🔍 Validando product_id:', formData.product_id);
      const { data: productExists, error: productCheckError } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', formData.product_id)
        .eq('organization_id', organizationId)
        .single();

      if (productCheckError || !productExists) {
        console.error('[CreateSaleModal] ❌ ERRO: Produto não encontrado', {
          product_id: formData.product_id,
          organization_id: organizationId,
          error: productCheckError,
        });
        
        setError('Produto selecionado não existe. Por favor, selecione outro produto.');
        toast.error('Produto selecionado não existe. Por favor, selecione outro produto.');
        setLoading(false);
        return;
      }

      console.log('[CreateSaleModal] ✅ Produto validado:', productExists.name);

      // PASSO 2 - Adicionar Debug Logs Completos
      console.log('[CreateSaleModal] 📋 Dados da venda antes de salvar:', {
        product_id: formData.product_id,
        product_name: productExists?.name,
        value: formData.stage_value,
        status: 'ativo',
        organization_id: organizationId,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        sale_type: formData.sale_type
      });

      // Log de venda retroativa
      const targetDate = formData.sale_type === 'unica' ? formData.sale_date : formData.start_date;
      if (isDateInPast(targetDate)) {
        console.log('[CreateSaleModal] ⚠️ Venda retroativa detectada:', {
          first_payment_due_date: targetDate,
          sale_type: formData.sale_type,
          value: formData.stage_value,
        });
      }


      if (formData.sale_type === 'unica') {
        const saleData = {
          client_id: formData.client_id,
          value: formData.final_amount,
          status: 'ativo',
          installments: parseInt(formData.installments) || 1,
          sale_date: formData.sale_date,
          first_payment_date: formData.first_payment_date,
          auto_payment_enabled: formData.auto_payment_enabled,
          notes: formData.notes,
          payment_method_id: formData.payment_method_id,
          sales_stage_id: formData.sales_stage_id,
          product_id: formData.product_id, // Adicionando product_id aqui também
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          discount_description: formData.discount_description,
          original_amount: formData.original_amount,
          final_amount: formData.final_amount,
          discount_granted_by: user?.id,
          discount_granted_at: new Date().toISOString(),
        };

        console.log('[CreateSaleModal] 📤 Chamando createSale com:', JSON.stringify(saleData, null, 2));
        const result = await createSale(organizationId, saleData);
        console.log('[CreateSaleModal] ✅ Venda salva com sucesso:', result);
        toast.success('Venda única criada com sucesso!');
      } else {
        const subscriptionData = {
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
        };

        console.log('[CreateSaleModal] 📤 Chamando createSubscription com:', JSON.stringify(subscriptionData, null, 2));
        await createSubscription(organizationId, subscriptionData);
        console.log('[CreateSaleModal] ✅ createSubscription retornou com sucesso');
        toast.success('Mensalidade criada com sucesso!');
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error('');
      console.error('═══════════════════════════════════════════════════════');
      console.error('[CreateSaleModal] ❌ ERRO CRÍTICO ao salvar');
      console.error('═══════════════════════════════════════════════════════');
      console.error('[CreateSaleModal] Detalhes do erro:', err);
      
      // PASSO 4 - Tratamento de Erro Melhorado
      if (err.code === '23503') {
        console.error('[CreateSaleModal] ❌ ERRO de Foreign Key (23503):', err.message);
        setError('Erro de validação: Verifique se o produto selecionado existe.');
        toast.error('Erro de validação: Verifique se o produto selecionado existe.');
      } else {
        setError(`Erro ao salvar: ${err.message || 'Erro inesperado'}`);
        toast.error(`Erro ao salvar: ${err.message || 'Erro inesperado'}`);
      }
      console.error('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentPhase(1);
    setValidationErrors([]);
    setError(null);
    setClientSearch('');
    onClose();
  };

  if (!isOpen) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-neutral-200">
          <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
            <span>❌</span> Erro ao Carregar Modal
          </h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Button
            onClick={handleClose}
            variant="primary"
            className="w-full bg-neutral-600 hover:bg-neutral-700 border-neutral-600"
          >
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-visible border border-neutral-200">
        
        {/* Header com Progresso */}
        <div className="p-6 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">Nova Venda</h2>
              <p className="text-sm text-neutral-500">Preencha os dados para registrar uma nova operação</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} icon={<X className="w-5 h-5" />} />
          </div>

          <div className="flex items-center gap-3">
            {Array.from({ length: totalPhases }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                  i + 1 < currentPhase ? 'bg-success-600 border-success-600 text-white' : 
                  i + 1 === currentPhase ? 'bg-primary-600 border-primary-600 text-white' : 
                  'bg-white border-neutral-300 text-neutral-500'
                }`}>
                  {i + 1 < currentPhase ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < totalPhases - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded-full ${i + 1 < currentPhase ? 'bg-success-600' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-10 h-10 animate-spin text-primary-600 mb-4" />
              <p className="text-neutral-500">Carregando dados do modal de vendas...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* FASE 1: Cliente */}
              {currentPhase === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 min-h-[400px]">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">1</span>
                    Selecionar Cliente
                  </h3>
                  <div className="relative">
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      icon={<Search className="w-5 h-5" />}
                      error={validationErrors.find(e => e.field === 'client_id')?.message}
                    />
                    {showClientDropdown && clientSearch && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto ring-1 ring-black/5">
                        {filteredClients.length > 0 ? (
                          filteredClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
                              onClick={() => {
                                setFormData({ ...formData, client_id: client.id });
                                setClientSearch(client.name);
                                setShowClientDropdown(false);
                              }}
                            >
                              <p className="font-semibold text-neutral-900">{client.name}</p>
                              <p className="text-xs text-neutral-500">{client.email}</p>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-neutral-500">Nenhum cliente encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.client_id && (
                    <Alert variant="success" title="Cliente Selecionado">
                      {clients.find(c => c.id === formData.client_id)?.name}
                    </Alert>
                  )}
                </div>
              )}

              {/* FASE 2: Produto */}
              {currentPhase === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">2</span>
                    Selecionar Produto
                  </h3>
                  <Select
                    label="Produto"
                    options={products.map(p => ({ value: p.id, label: p.name }))}
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value, sales_stage_id: '' })}
                    placeholder="Escolha um produto..."
                    error={validationErrors.find(e => e.field === 'product_id')?.message}
                  />
                </div>
              )}

              {/* FASE 3: Etapa e Tipo */}
              {currentPhase === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">3</span>
                    Etapa de Venda e Tipo
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {productSalesStages
                      .filter(s => s.product_id === formData.product_id)
                      .map(stage => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            sales_stage_id: stage.id, 
                            stage_value: stage.value,
                            sale_type: stage.sale_type
                          })}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            formData.sales_stage_id === stage.id 
                              ? 'border-primary-600 bg-primary-50 shadow-md' 
                              : 'border-neutral-200 hover:border-primary-300 bg-white'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-bold text-neutral-900">{stage.name}</p>
                            <Badge variant={stage.sale_type === 'unica' ? 'default' : 'warning'} size="sm" className="mt-1">
                              {stage.sale_type === 'unica' ? 'Venda Única' : 'Mensalidade'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-primary-700">R$ {stage.value.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                  {validationErrors.find(e => e.field === 'sales_stage_id') && (
                    <p className="text-sm text-destructive-600">{validationErrors.find(e => e.field === 'sales_stage_id')?.message}</p>
                  )}
                </div>
              )}

              {/* FASE 4: Pagamento */}
              {currentPhase === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">4</span>
                    Forma de Pagamento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentMethods.filter(pm => pm.active).map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method_id: pm.id })}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formData.payment_method_id === pm.id 
                            ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold' 
                            : 'border-neutral-200 hover:border-primary-300 bg-white text-neutral-600'
                        }`}
                      >
                        {pm.name}
                      </button>
                    ))}
                  </div>
                  {validationErrors.find(e => e.field === 'payment_method_id') && (
                    <p className="text-sm text-destructive-600">{validationErrors.find(e => e.field === 'payment_method_id')?.message}</p>
                  )}
                </div>
              )}

              {/* FASE 5: Datas Dinâmicas */}
              {currentPhase === 5 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">5</span>
                    Definição de Datas e Valores
                  </h3>
                  
                  {formData.sale_type === 'unica' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Nº de Parcelas"
                        type="number"
                        min="1"
                        value={formData.installments}
                        onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                        error={validationErrors.find(e => e.field === 'installments')?.message}
                      />
                      <Input
                        label="Data da Venda (Início)"
                        type="date"
                        value={formData.sale_date}
                        onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                        error={validationErrors.find(e => e.field === 'sale_date')?.message}
                      />
                      <Input
                        label="Data do 1º Vencimento"
                        type="date"
                        value={formData.first_payment_date}
                        onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                        error={validationErrors.find(e => e.field === 'first_payment_date')?.message}
                      />
                      {formData.first_payment_date && isDateInPast(formData.first_payment_date) && (
                        <div className="col-span-full mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-800">
                            ⚠️ <strong>Data no passado:</strong> Você está registrando uma venda retroativa.
                          </p>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Data de Início"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        error={validationErrors.find(e => e.field === 'start_date')?.message}
                      />
                      <Input
                        label="Data do 1º Pagamento"
                        type="date"
                        value={formData.first_payment_due_date}
                        onChange={(e) => setFormData({ ...formData, first_payment_due_date: e.target.value })}
                        error={validationErrors.find(e => e.field === 'first_payment_due_date')?.message}
                      />
                      {(isDateInPast(formData.first_payment_due_date) || isDateInPast(formData.start_date)) && (
                        <div className="col-span-full mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-800">
                            ⚠️ <strong>Data no passado:</strong> Você está registrando uma mensalidade retroativa.
                          </p>
                        </div>
                      )}

                    </div>
                  )}
                  
                  {/* Seção de Desconto */}
                  <div className="space-y-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary-600" />
                      <h4 className="font-semibold text-neutral-900">Desconto (Opcional)</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Tipo de Desconto"
                        options={[
                          { value: 'none', label: 'Sem desconto' },
                          { value: 'fixed', label: 'Valor Fixo (R$)' },
                          { value: 'percentage', label: 'Percentual (%)' },
                        ]}
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                      />

                      {formData.discount_type !== 'none' && (
                        <Input
                          label={formData.discount_type === 'fixed' ? 'Desconto (R$)' : 'Desconto (%)'}
                          type="number"
                          step={formData.discount_type === 'fixed' ? '0.01' : '0.1'}
                          min="0"
                          max={formData.discount_type === 'percentage' ? '100' : undefined}
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                          icon={formData.discount_type === 'fixed' ? <DollarSign className="w-5 h-5" /> : <Percent className="w-5 h-5" />}
                        />
                      )}
                    </div>

                    {formData.discount_type !== 'none' && (
                      <Input
                        label="Motivo/Descrição do Desconto"
                        value={formData.discount_description}
                        onChange={(e) => setFormData({ ...formData, discount_description: e.target.value })}
                        placeholder="Ex: Cupom BLACKFRIDAY, Desconto fidelidade..."
                      />
                    )}
                  </div>
                  
                  <Card variant="primary" padding="md" className="bg-primary-50 border-primary-100 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-700 font-medium">Valor Total:</span>
                      <span className="text-xl font-bold text-primary-900">R$ {formData.stage_value.toFixed(2)}</span>
                    </div>
                    {formData.sale_type === 'unica' && parseInt(formData.installments) > 1 && (
                      <p className="text-xs text-primary-600 text-right mt-1">
                        {formData.installments}x de R$ {(formData.stage_value / (parseInt(formData.installments) || 1)).toFixed(2)}
                      </p>
                    )}
                  </Card>
                </div>
              )}

              {/* FASE 6: Extra ou Final */}
              {currentPhase === 6 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">6</span>
                    {formData.sale_type === 'mensalidade' ? 'Data Final (Opcional)' : 'Finalização'}
                  </h3>

                  {formData.sale_type === 'mensalidade' ? (
                    <>
                      <p className="text-sm text-neutral-500">Deixe em branco para mensalidade sem data de término definida.</p>
                      <Input
                        label="Data Final"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        error={validationErrors.find(e => e.field === 'end_date')?.message}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Card padding="md" variant="primary" className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">Baixa Automática</p>
                          <p className="text-xs text-neutral-500">Marcar parcelas como pagas automaticamente no vencimento</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.auto_payment_enabled}
                          onChange={(e) => setFormData({ ...formData, auto_payment_enabled: e.target.checked })}
                          className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                        />
                      </Card>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Observações</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24 resize-none"
                          placeholder="Alguma nota importante sobre esta venda?"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FASE 7: Finalização (Só para Mensalidade) */}
              {currentPhase === 7 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">7</span>
                    Finalização
                  </h3>
                  <div className="space-y-4">
                    <Card padding="md" variant="primary" className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">Baixa Automática</p>
                        <p className="text-xs text-neutral-500">Marcar pagamentos como pagos automaticamente no vencimento</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.auto_payment_enabled}
                        onChange={(e) => setFormData({ ...formData, auto_payment_enabled: e.target.checked })}
                        className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                      />
                    </Card>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-700">Observações</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24 resize-none"
                        placeholder="Alguma nota importante sobre esta mensalidade?"
                      />
                    </div>
                  </div>
                </div>
              )}

            </form>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePreviousPhase}
            disabled={currentPhase === 1 || loading}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar
          </Button>

          {currentPhase < totalPhases ? (
            <Button
              variant="primary"
              onClick={handleNextPhase}
              disabled={loading}
              className="px-8"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Continuar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              className="px-8 bg-success-600 hover:bg-success-700 border-success-600"
              icon={<Check className="w-4 h-4" />}
            >
              {loading ? 'Salvando...' : 'Finalizar e Salvar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};