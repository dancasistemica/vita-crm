import { useState, useEffect } from 'react';
import { Card, Button } from "@/components/ui/ds";
import { X, Loader2 } from 'lucide-react';
import { SalesForm } from './SalesForm';
import { updateSale } from '@/services/saleService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SalesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  onSuccess: () => void;
}

export const SalesEditModal = ({ 
  isOpen, 
  onClose, 
  sale, 
  onSuccess 
}: SalesEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [fullSaleData, setFullSaleData] = useState<any>(sale);

  useEffect(() => {
    if (isOpen && sale?.id && sale?.sale_type === 'unica') {
      fetchInstallmentDetails();
    } else if (isOpen && sale) {
      setFullSaleData({
        ...sale,
        first_payment_date: sale.start_date || sale.created_at?.split('T')[0]
      });
    }
  }, [isOpen, sale?.id]);

  const fetchInstallmentDetails = async () => {
    try {
      setFetchingDetails(true);
      console.log('[SalesEditModal] Buscando detalhes da primeira parcela para:', sale.id);
      
      const { data, error } = await supabase
        .from('sale_installments')
        .select('due_date')
        .eq('sale_id', sale.id)
        .eq('installment_number', 1)
        .maybeSingle();

      if (error) throw error;

      setFullSaleData({
        ...sale,
        first_payment_date: data?.due_date || sale.sale_date || sale.created_at?.split('T')[0]
      });
    } catch (err) {
      console.error('[SalesEditModal] Erro ao buscar parcela:', err);
      setFullSaleData(sale);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      console.log('[SalesEditModal] Atualizando venda:', sale.id, formData);

      // Preparar os dados para atualização baseado no tipo de venda
      const isUnica = sale.sale_type === 'unica';
      
      // Criar objeto limpo apenas com colunas que existem no banco
      const cleanData: any = {
        product_id: formData.product_id || null,
        status: formData.status || sale.status,
        notes: formData.notes || '',
      };
      
      console.log('[SalesEditModal] formData:', formData);

      if (isUnica) {
        // Campos para tabela 'sales'
        cleanData.value = formData.amount;
        cleanData.discount_type = formData.discount_type;
        cleanData.discount_value = formData.discount_value;
        cleanData.discount_description = formData.discount_description;
        cleanData.original_amount = formData.original_amount;
        cleanData.final_amount = formData.final_amount;
        cleanData.discount_granted_by = formData.discount_granted_by;
        cleanData.discount_granted_at = formData.discount_granted_at;
        cleanData.sale_date = formData.sale_date;

        // Se a data da primeira parcela mudou, atualizar na tabela sale_installments
        if (formData.first_payment_date) {
          console.log('[SalesEditModal] Atualizando data da primeira parcela');
          const { error: installmentError } = await supabase
            .from('sale_installments')
            .update({ due_date: formData.first_payment_date })
            .eq('sale_id', sale.id)
            .eq('installment_number', 1);

          if (installmentError) {
            console.error('[SalesEditModal] Erro ao atualizar parcela:', installmentError);
          }
        }
      } else {
        // Campos para tabela 'subscriptions'
        cleanData.monthly_value = formData.amount;
        cleanData.start_date = formData.first_payment_date;
        // Na mensalidade, o start_date pode ser considerado tanto a data de venda quanto da primeira parcela
      }

      console.log('[SalesEditModal] Enviando dados limpos para updateSale:', cleanData);
      
      const success = await updateSale(sale.id, sale.sale_type, cleanData);
      
      if (success) {
        toast.success('Venda atualizada com sucesso!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('[SalesEditModal] Erro ao atualizar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Falha ao atualizar venda: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card variant="elevated" padding="none" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-neutral-200 bg-white">
          <h2 className="text-xl font-bold text-neutral-900">Editar Venda</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<X className="w-5 h-5" />} 
            onClick={onClose} 
          />
        </div>
        
        <div className="p-6">
          {fetchingDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
              <p className="text-neutral-600">Buscando detalhes da venda...</p>
            </div>
          ) : (
            <SalesForm 
              initialData={fullSaleData} 
              onSubmit={handleSubmit} 
              isLoading={loading}
              isEditing={true}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
