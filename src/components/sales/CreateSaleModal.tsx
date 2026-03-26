import { useState, useEffect, useMemo } from 'react';
import { X, Loader, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSaleWithInstallments } from '@/services/salesService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export const CreateSaleModal = ({ isOpen, onClose, onSuccess }: CreateSaleModalProps) => {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    client_id: '',
    installments: '1',
    first_payment_date: '',
    auto_payment_enabled: true,
    notes: '',
  });

  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    if (isOpen && organization?.id) {
      loadClients();
      loadProducts();
    }
  }, [isOpen, organization?.id]);

  const loadClients = async () => {
    if (!organization?.id) return;

    try {
      console.log('[CreateSaleModal] 🔄 Carregando clientes...');
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (error) throw error;
      console.log('[CreateSaleModal] ✅ Clientes carregados:', data?.length || 0);
      setClients(data || []);
    } catch (error) {
      console.error('[CreateSaleModal] ❌ Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoadingClients(false);
    }
  };

  const loadProducts = async () => {
    if (!organization?.id) return;

    try {
      console.log('[CreateSaleModal] 🔄 Carregando produtos...');
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });

      if (error) throw error;
      console.log('[CreateSaleModal] ✅ Produtos carregados:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('[CreateSaleModal] ❌ Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const previewSubtotal = useMemo(() => {
    const quantity = Number.parseInt(itemQuantity, 10);
    const unitPrice = itemPrice ? Number.parseFloat(itemPrice) : 0;
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
      return 0;
    }
    return quantity * unitPrice;
  }, [itemQuantity, itemPrice]);

  const handleAddItem = () => {
    if (!selectedProduct || !itemQuantity) {
      toast.error('Selecione um produto e quantidade');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    const quantity = Number.parseInt(itemQuantity, 10);
    const unitPrice = itemPrice ? Number.parseFloat(itemPrice) : product.price;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Quantidade inválida');
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error('Preço inválido');
      return;
    }

    const subtotal = quantity * unitPrice;

    const newItem: SaleItem = {
      id: Math.random().toString(),
      product_id: selectedProduct,
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      subtotal,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setItemQuantity('1');
    setItemPrice('');

    console.log('[CreateSaleModal] ✅ Item adicionado:', newItem);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const totalValue = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    if (!formData.client_id) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!clients.some(client => client.id === formData.client_id)) {
      toast.error('Cliente inválido');
      return;
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos um produto');
      return;
    }

    if (!formData.first_payment_date) {
      toast.error('Defina a data da primeira parcela');
      return;
    }

    const parsedInstallments = Number.parseInt(formData.installments, 10);

    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    if (!Number.isFinite(parsedInstallments) || parsedInstallments < 1) {
      toast.error('Informe uma quantidade de parcelas válida');
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateSaleModal] Criando venda com', items.length, 'itens');

      await createSaleWithInstallments(organization.id, {
        client_id: formData.client_id,
        value: totalValue,
        status: 'pendente',
        installments: parsedInstallments,
        first_payment_date: formData.first_payment_date,
        auto_payment_enabled: formData.auto_payment_enabled,
        notes: formData.notes,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      toast.success('Venda criada com sucesso!');

      setFormData({
        client_id: '',
        installments: '1',
        first_payment_date: '',
        auto_payment_enabled: true,
        notes: '',
      });
      setItems([]);
      setSelectedProduct('');
      setItemQuantity('1');
      setItemPrice('');

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between sticky top-0">
          <h2 className="font-bold text-blue-900">Criar Nova Venda</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-blue-100 rounded transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-gray-900">Informacoes da Venda</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
              {loadingClients ? (
                <div className="flex items-center justify-center p-2 min-h-[44px]">
                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                </div>
              ) : (
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Parcelas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da 1a Parcela *</label>
                <input
                  type="date"
                  value={formData.first_payment_date}
                  onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_payment_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_payment_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Baixa automatica no vencimento</p>
                  <p className="text-xs text-gray-600">
                    Sistema marca como pago automaticamente na data de vencimento
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-gray-900">Produtos</h3>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produto *</label>
                {loadingProducts ? (
                  <div className="flex items-center justify-center p-2 min-h-[44px]">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      const product = products.find(p => p.id === e.target.value);
                      if (product) {
                        setItemPrice(product.price.toString());
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (R$ {product.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preco Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtotal</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900 font-medium min-h-[44px] flex items-center">
                    R$ {previewSubtotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Adicionar Produto
              </button>
            </div>

            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x R$ {item.unit_price.toFixed(2)} = R$ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors min-h-[44px] min-w-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Valor Total da Venda:</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {totalValue.toFixed(2)}</p>
                  </div>
                  {Number.parseInt(formData.installments, 10) > 1 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Parcela: R$ {(totalValue / Number.parseInt(formData.installments, 10)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-b pb-4">
            <label className="block text-sm font-medium text-gray-700">Observacoes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Adicione notas sobre esta venda..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32 overflow-y-auto"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              As datas das parcelas serao calculadas automaticamente com base na data da 1a parcela
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Criar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
