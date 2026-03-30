import { useState, useEffect } from 'react';
import { X, Loader, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface EditSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
  onSuccess?: () => void;
}

export default function EditSaleModal({ open, onOpenChange, saleId, onSuccess }: EditSaleModalProps) {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const [saleData, setSaleData] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && saleId && organization?.id) {
      loadSaleDetails();
    }
  }, [open, saleId, organization?.id]);

  const loadSaleDetails = async () => {
    try {
      setLoadingData(true);
      console.log('[EditSaleModal] Carregando detalhes da venda:', saleId);

      // Tentar carregar de 'sales' primeiro
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          leads(name),
          product_sales_stages(name, value)
        `)
        .eq('id', saleId)
        .maybeSingle();

      if (sale) {
        setSaleData({ ...sale, type: 'unica' });
        setStatus(sale.status || '');
        setNotes(sale.notes || '');
        return;
      }

      // Se não encontrar, tentar em 'subscriptions'
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          leads(name),
          product_sales_stages(name, value)
        `)
        .eq('id', saleId)
        .maybeSingle();

      if (subscription) {
        setSaleData({ ...subscription, type: 'mensalidade' });
        setStatus(subscription.status || '');
        setNotes(subscription.notes || '');
      } else {
        toast.error('Venda não encontrada');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('[EditSaleModal] Erro ao carregar:', error);
      toast.error('Erro ao carregar dados da venda');
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleData) return;

    setLoading(true);
    try {
      const table = saleData.type === 'unica' ? 'sales' : 'subscriptions';
      
      const { error } = await supabase
        .from(table)
        .update({
          status: status,
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleId);

      if (error) throw error;

      toast.success('Venda atualizada com sucesso!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('[EditSaleModal] Erro ao atualizar:', error);
      toast.error('Erro ao atualizar venda');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Editar Venda</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {loadingData ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Buscando informações...</p>
          </div>
        ) : saleData ? (
          <form onSubmit={handleUpdate} className="p-6 space-y-6">
            {/* Resumo (Readonly) */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Informações da Venda</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-400 font-medium">Cliente</p>
                  <p className="text-sm font-bold text-blue-900 truncate">{saleData.leads?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-400 font-medium">Produto/Etapa</p>
                  <p className="text-sm font-bold text-blue-900 truncate">{saleData.product_sales_stages?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-400 font-medium">Tipo</p>
                  <p className="text-sm font-bold text-blue-900 capitalize">{saleData.type}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-400 font-medium">Valor</p>
                  <p className="text-sm font-bold text-blue-900">
                    {Number(saleData.monthly_value || saleData.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Campos Editáveis */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status da Venda</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observações Internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Adicione detalhes sobre a negociação, pagamentos, etc..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
