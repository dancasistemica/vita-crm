import { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Alert } from '@/components/ui/ds';
import { DollarSign, Percent, Info } from 'lucide-react';

interface SalesFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  initialData?: any;
}

export const SalesForm = ({ onSubmit, isLoading, initialData }: SalesFormProps) => {
  const [formData, setFormData] = useState({
    client_name: initialData?.client_name || '',
    client_email: initialData?.client_email || '',
    product_id: initialData?.product_id || '',
    amount: initialData?.original_amount || initialData?.amount || '',
    discount_type: initialData?.discount_type || 'none', // 'none', 'fixed', 'percentage'
    discount_value: initialData?.discount_value || '',
    discount_description: initialData?.discount_description || '',
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
        discountAmount = Math.min(discountValue, originalAmount); // Não pode ser maior que o valor
        finalAmount = originalAmount - discountAmount;
      } else if (formData.discount_type === 'percentage') {
        // Desconto em %
        if (discountValue > 100) {
          discountAmount = originalAmount; // Máximo 100%
          finalAmount = 0;
        } else {
          discountAmount = (originalAmount * discountValue) / 100;
          finalAmount = originalAmount - discountAmount;
        }
      }
    }

    setCalculatedValues({
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: Math.max(0, finalAmount), // Não pode ser negativo
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

    console.log('[SalesForm] Enviando formulário de venda');

    const submitData = {
      ...formData,
      amount: calculatedValues.final_amount, // Enviar valor final
      original_amount: calculatedValues.original_amount,
      final_amount: calculatedValues.final_amount,
      discount_value: formData.discount_type !== 'none' ? parseFloat(formData.discount_value) || 0 : 0,
    };

    console.log('[SalesForm] Dados a enviar:', submitData);

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('[SalesForm] Erro ao enviar:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nome do Cliente"
        value={formData.client_name}
        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
        required
      />

      <Input
        label="Email do Cliente"
        type="email"
        value={formData.client_email}
        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
        required
      />

      {/* Valor Original */}
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

      {/* NOVO: Seção de Desconto */}
      <Card variant="elevated" padding="lg" className="space-y-4 bg-neutral-50 border-neutral-200">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-info-600" />
          <h3 className="font-semibold text-neutral-900">Desconto (Opcional)</h3>
        </div>

        {/* Tipo de Desconto */}
        <Select
          label="Tipo de Desconto"
          options={[
            { value: 'none', label: 'Sem desconto' },
            { value: 'fixed', label: 'Valor Fixo (R$)' },
            { value: 'percentage', label: 'Percentual (%)' },
          ]}
          value={formData.discount_type}
          onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
        />

        {/* Campo de Valor do Desconto (se selecionado) */}
        {formData.discount_type !== 'none' && (
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
        )}

        {/* Descrição do Desconto */}
        {formData.discount_type !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Motivo/Descrição do Desconto
            </label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-sm text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              value={formData.discount_description}
              onChange={(e) => setFormData({ ...formData, discount_description: e.target.value })}
              placeholder="Ex: Cupom BLACKFRIDAY, Desconto fidelidade..."
            />
          </div>
        )}

        {/* Resumo de Valores */}
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar Venda' : 'Finalizar Venda'}
        </Button>
      </div>
    </form>
  );
};
