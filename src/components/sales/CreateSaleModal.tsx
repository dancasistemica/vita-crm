import { useEffect, useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSaleWithInstallments } from '@/services/salesService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateSaleModal = ({ isOpen, onClose, onSuccess }: CreateSaleModalProps) => {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [formData, setFormData] = useState({
    client_id: '',
    value: '',
    installments: '1',
    first_payment_date: '',
    auto_payment_enabled: true,
    notes: '',
  });

  useEffect(() => {
    if (isOpen && organization?.id) {
      loadClients();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    if (!formData.client_id || !formData.value || !formData.first_payment_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const parsedValue = parseFloat(formData.value);
    const parsedInstallments = parseInt(formData.installments, 10);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    if (!Number.isFinite(parsedInstallments) || parsedInstallments < 1) {
      toast.error('Informe uma quantidade de parcelas válida');
      return;
    }

    console.log('[CreateSaleModal] Iniciando criação de venda com parcelamento');
    setLoading(true);
    try {
      await createSaleWithInstallments(organization.id, {
        client_id: formData.client_id,
        value: parsedValue,
        status: 'pendente',
        installments: parsedInstallments,
        first_payment_date: formData.first_payment_date,
        auto_payment_enabled: formData.auto_payment_enabled,
        notes: formData.notes,
      });

      toast.success('Venda criada com sucesso!');
      setFormData({
        client_id: '',
        value: '',
        installments: '1',
        first_payment_date: '',
        auto_payment_enabled: true,
        notes: '',
      });
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Total (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

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
            {formData.value && formData.installments && (
              <p className="text-sm text-gray-500 mt-1">
                Parcela: R$ {(parseFloat(formData.value) / parseInt(formData.installments, 10)).toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da 1ª Parcela *
            </label>
            <input
              type="date"
              value={formData.first_payment_date}
              onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
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
                <p className="font-medium text-gray-900">Baixa automática no vencimento</p>
                <p className="text-xs text-gray-600">
                  Sistema marca como pago automaticamente na data de vencimento
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
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
              As datas das parcelas serão calculadas automaticamente com base na data da 1ª parcela
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
              disabled={loading}
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
