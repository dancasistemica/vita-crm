import React, { useState, useEffect } from 'react';
import { updateInstallmentStatus } from '../services/installmentService';
import { Button } from './ui/ds';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: any;
  onUpdate: () => void;
}

export default function InstallmentModal({
  isOpen,
  onClose,
  installment,
  onUpdate,
}: InstallmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(installment?.status || 'pendente');
  const [paidDate, setPaidDate] = useState(installment?.paid_date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(installment?.payment_method || '');

  // Atualizar estados locais quando o installment mudar
  useEffect(() => {
    if (installment) {
      setNewStatus(installment.status || 'pendente');
      setPaidDate(installment.paid_date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(installment.payment_method || '');
    }
  }, [installment]);

  const isMensalidade = installment?.type === 'mensalidade';

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('[InstallmentModal] 💾 Salvando alterações');
      console.log('[InstallmentModal] Item ID:', installment.id);
      console.log('[InstallmentModal] Tipo:', installment.type);
      console.log('[InstallmentModal] Novo status:', newStatus);

      await updateInstallmentStatus(
        installment.id,
        installment.type,
        newStatus,
        paidDate,
        paymentMethod
      );

      console.log('[InstallmentModal] ✅ Alterações salvas');
      toast.success(isMensalidade ? 'Mensalidade atualizada com sucesso' : 'Parcela atualizada com sucesso');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('[InstallmentModal] ❌ ERRO ao salvar:', error);
      toast.error('Erro ao atualizar item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {isMensalidade ? 'Dar Baixa em Mensalidade' : 'Editar Parcela'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Item */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-medium text-slate-900">{installment?.client_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Produto:</span>
              <span className="font-medium text-slate-900">{installment?.product_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tipo:</span>
              <span className="font-medium text-slate-900">{isMensalidade ? 'Mensalidade Recorrente' : 'Venda Única'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Valor:</span>
              <span className="font-bold text-primary-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installment?.amount || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{isMensalidade ? 'Referência:' : 'Vencimento:'}</span>
              <span className="font-medium text-slate-900">
                {installment?.due_date ? new Date(installment.due_date).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {isMensalidade ? 'Marcar como:' : 'Status do Pagamento'}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="pago">✅ Pago</option>
                <option value="atrasado">⚠️ Atrasado</option>
                {!isMensalidade && <option value="cancelado">❌ Cancelado</option>}
              </select>
            </div>

            {/* Campos Condicionais para Pago */}
            {newStatus === 'pago' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Método de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="">Selecione...</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                    <option value="Pix">📱 Pix</option>
                    <option value="Boleto">📄 Boleto</option>
                    <option value="Dinheiro">💵 Dinheiro</option>
                    <option value="Transferência">🏦 Transferência</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
