import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, Input, Select, Button, Alert } from '@/components/ui/ds';
import { DollarSign, Percent, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SalesFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  initialData?: any;
  isEditing?: boolean;
}

export const SalesForm = ({ 
  onSubmit, 
  isLoading, 
  initialData,
  isEditing = false 
}: SalesFormProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    client_name: initialData?.client_name || '',
    client_email: initialData?.client_email || '',
    product_id: initialData?.product_id || '',
    amount: initialData?.original_amount || initialData?.amount || '',
    discount_type: initialData?.discount_type || 'none',
    discount_value: initialData?.discount_value || '',
    discount_description: initialData?.discount_description || '',
    sale_date: initialData?.sale_date || initialData?.start_date || new Date().toISOString().split('T')[0],
    first_payment_date: initialData?.first_payment_date || initialData?.start_date || new Date().toISOString().split('T')[0],
  });

  const [calculatedValues, setCalculatedValues] = useState({
    original_amount: parseFloat(formData.amount) || 0,
    discount_amount: 0,
    final_amount: parseFloat(formData.amount) || 0,
  });

  // Recalcular valores quando amount ou desconto mudam
  useEffect(() => {
    const originalAmount = parseFloat(formData.amount) || 0;
    let discountAmount = 0;
    let finalAmount = originalAmount;

    if (formData.discount_type !== 'none' && formData.discount_value) {
      const discountValue = parseFloat(formData.discount_value) || 0;

      if (formData.discount_type === 'fixed') {
        // Desconto em R$
        discountAmount = Math.min(discountValue, originalAmount);
        finalAmount = originalAmount - discountAmount;
      } else if (formData.discount_type === 'percentage') {
        // Desconto em %
        if (discountValue > 100) {
          discountAmount = originalAmount;
          finalAmount = 0;
        } else if (discountValue < 0) {
          discountAmount = 0;
          finalAmount = originalAmount;
        } else {
          discountAmount = (originalAmount * discountValue) / 100;
          finalAmount = originalAmount - discountAmount;
        }
      }
    }

    setCalculatedValues({
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: Math.max(0, finalAmount),
    });

    console.log('[SalesForm] Valores calculados:', {
      original_amount: originalAmount,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      discount_amount: discountAmount,
      final_amount: finalAmount,
    });
  }, [formData.amount, formData.discount_type, formData.discount_value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[SalesForm] 📝 Enviando formulário de venda');

    // Validações
    const errors: string[] = [];

    if (!formData.client_name.trim()) {
      errors.push('Nome do cliente é obrigatório');
    }
    if (!formData.client_email.trim()) {
      errors.push('Email do cliente é obrigatório');
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Valor da venda deve ser maior que 0');
    }

    // Validação de desconto
    if (formData.discount_type !== 'none') {
      if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
        errors.push('Valor do desconto deve ser maior que 0');
      }
      if (!formData.discount_description.trim()) {
        errors.push('Descrição do desconto é obrigatória para rastreabilidade');
      }

      // Validar se desconto não é maior que valor original
      if (formData.discount_type === 'fixed') {
        if (parseFloat(formData.discount_value) > parseFloat(formData.amount)) {
          errors.push('Desconto em R$ não pode ser maior que o valor da venda');
        }
      }
    }

    if (errors.length > 0) {
      console.log('[SalesForm] ❌ Erros de validação:', errors);
      errors.forEach(err => toast.error(err));
      return;
    }

    const submitData = {
      ...formData,
      amount: calculatedValues.final_amount,
      original_amount: calculatedValues.original_amount,
      final_amount: calculatedValues.final_amount,
      discount_value: formData.discount_type !== 'none' ? parseFloat(formData.discount_value) || 0 : 0,
      discount_granted_by: user?.id,
      discount_granted_at: new Date().toISOString(),
    };

    console.log('[SalesForm] ✅ Validação OK, enviando:', submitData);

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('[SalesForm] ❌ Erro ao enviar:', error);
      toast.error('Erro ao salvar venda');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Nome do Cliente"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          required
          disabled={isEditing}
          className={isEditing ? "bg-neutral-100 opacity-70 cursor-not-allowed" : ""}
        />

        <Input
          label="Email do Cliente"
          type="email"
          value={formData.client_email}
          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
          required
          disabled={isEditing}
          className={isEditing ? "bg-neutral-100 opacity-70 cursor-not-allowed" : ""}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data da Venda"
            type="date"
            value={formData.sale_date}
            onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
            required
          />

          <Input
            label="Data da 1ª Parcela / Início"
            type="date"
            value={formData.first_payment_date}
            onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
            required
          />
        </div>

        <Input
          label="Valor da Venda (R$)"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          icon={<DollarSign className="w-5 h-5" />}
          required
        />

        <Card variant="elevated" padding="lg" className="space-y-4 bg-neutral-50 border-neutral-200">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-info-600" />
            <h3 className="font-semibold text-neutral-900">Desconto</h3>
          </div>

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
            <>
              <Input
                label={formData.discount_type === 'fixed' ? 'Desconto (R$)' : 'Desconto (%)'}
                type="number"
                step={formData.discount_type === 'fixed' ? '0.01' : '0.1'}
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                icon={formData.discount_type === 'fixed' ? <DollarSign className="w-5 h-5" /> : <Percent className="w-5 h-5" />}
                placeholder={formData.discount_type === 'fixed' ? '0.00' : '0'}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Motivo/Descrição do Desconto <span className="text-error-500">*</span>
                </label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 text-sm text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  value={formData.discount_description}
                  onChange={(e) => setFormData({ ...formData, discount_description: e.target.value })}
                  placeholder="Ex: Cupom BLACKFRIDAY, Desconto fidelidade..."
                  required
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t border-neutral-200 space-y-2">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Subtotal:</span>
              <span>R$ {calculatedValues.original_amount.toFixed(2)}</span>
            </div>
            {calculatedValues.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-success-600 font-medium">
                <span>Desconto ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : 'R$'}):</span>
                <span>- R$ {calculatedValues.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-neutral-900 pt-2 border-t border-neutral-100">
              <span>Total Final:</span>
              <span className="text-primary-700">R$ {calculatedValues.final_amount.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Venda' : 'Finalizar Venda'}
        </Button>
      </div>
    </form>
  );
};
