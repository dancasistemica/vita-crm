import { useState } from 'react';
import { Card, Button } from "@/components/ui/ds";
import { X } from 'lucide-react';
import { SalesForm } from './SalesForm';
import { updateSale } from '@/services/saleService';
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

  if (!isOpen) return null;

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

      if (isUnica) {
        // Campos para tabela 'sales'
        cleanData.value = formData.amount;
        cleanData.client_email = formData.client_email;
        cleanData.discount_type = formData.discount_type;
        cleanData.discount_value = formData.discount_value;
        cleanData.discount_description = formData.discount_description;
        cleanData.original_amount = formData.original_amount;
        cleanData.final_amount = formData.final_amount;
        cleanData.discount_granted_by = formData.discount_granted_by;
        cleanData.discount_granted_at = formData.discount_granted_at;
      } else {
        // Campos para tabela 'subscriptions'
        cleanData.monthly_value = formData.amount;
        // Se houver um lead_id, não precisamos de client_email na tabela subscriptions
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
          <SalesForm 
            initialData={sale} 
            onSubmit={handleSubmit} 
            isLoading={loading}
            isEditing={true}
          />
        </div>
      </Card>
    </div>
  );
};
