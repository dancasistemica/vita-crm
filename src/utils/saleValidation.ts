export interface ValidationError {
  field: string;
  message: string;
}

export interface SaleFormData {
  client_id: string;
  product_id: string;
  sales_stage_id: string;
  stage_value: number;
  payment_method_id: string;
  sale_type: 'unica' | 'mensalidade';
  // Venda Única
  installments: string;
  sale_date: string;
  first_payment_date: string;
  // Mensalidade
  start_date: string;
  end_date: string;
  first_payment_due_date: string;
  // Comum
  auto_payment_enabled: boolean;
  notes: string;
  // Desconto
  discount_type: 'none' | 'fixed' | 'percentage';
  discount_value: number;
  discount_description: string;
  original_amount: number;
  final_amount: number;
}

export const validatePhase = (
  formData: SaleFormData,
  phase: number,
  saleType: 'unica' | 'mensalidade'
): ValidationError[] => {
  const errors: ValidationError[] = [];

  console.log('[saleValidation] Validando fase:', { phase, saleType });

  switch (phase) {
    case 1: // Cliente
      if (!formData.client_id) {
        errors.push({ field: 'client_id', message: 'Cliente não selecionado' });
      }
      break;

    case 2: // Produto
      if (!formData.product_id) {
        errors.push({ field: 'product_id', message: 'Produto não selecionado' });
      }
      break;

    case 3: // Etapa + Tipo de Venda
      if (!formData.sales_stage_id) {
        errors.push({ field: 'sales_stage_id', message: 'Etapa de venda não selecionada' });
      }
      if (formData.stage_value <= 0) {
        errors.push({ field: 'stage_value', message: 'Valor da etapa deve ser maior que 0' });
      }
      break;

    case 4: // Forma de Pagamento
      if (!formData.payment_method_id) {
        errors.push({ field: 'payment_method_id', message: 'Forma de pagamento não selecionada' });
      }
      break;

    case 5: // Datas (dinâmicas)
      if (saleType === 'unica') {
        // Validar parcelas
        const installments = parseInt(formData.installments) || 0;
        if (installments < 1) {
          errors.push({ field: 'installments', message: 'Número de parcelas deve ser maior que 0' });
        }

        // Validar data da venda
        if (!formData.sale_date) {
          errors.push({ field: 'sale_date', message: 'Data da venda é obrigatória' });
        } else {
          const selectedDate = new Date(formData.sale_date + 'T00:00:00');
          if (isNaN(selectedDate.getTime())) {
            errors.push({ field: 'sale_date', message: 'Data de venda inválida' });
          }
        }

        // Validar data primeiro vencimento
        if (!formData.first_payment_date) {
          errors.push({ field: 'first_payment_date', message: 'Data do 1º vencimento é obrigatória' });
        } else {
          const selectedDate = new Date(formData.first_payment_date + 'T00:00:00');
          if (isNaN(selectedDate.getTime())) {
            errors.push({ field: 'first_payment_date', message: 'Data do 1º vencimento inválida' });
          }
        }
      } else {
        // Mensalidade
        if (!formData.start_date) {
          errors.push({ field: 'start_date', message: 'Data de início é obrigatória' });
        }

        if (!formData.first_payment_due_date) {
          errors.push({ field: 'first_payment_due_date', message: 'Data do 1º pagamento é obrigatória' });
        }

        if (formData.start_date && formData.first_payment_due_date) {
          const startDate = new Date(formData.start_date + 'T00:00:00');
          const paymentDate = new Date(formData.first_payment_due_date + 'T00:00:00');

          if (paymentDate < startDate) {
            errors.push({
              field: 'first_payment_due_date',
              message: 'Data do pagamento deve ser após o início',
            });
          }
        }
      }
      break;

    case 6: // Data Final (mensalidade) - opcional
      if (formData.end_date && formData.start_date) {
        const startDate = new Date(formData.start_date + 'T00:00:00');
        const endDate = new Date(formData.end_date + 'T00:00:00');

        if (endDate <= startDate) {
          errors.push({
            field: 'end_date',
            message: 'Data final deve ser após a data de início',
          });
        }
      }
      break;
  }

  return errors;
};

export const validateFormComplete = (
  formData: SaleFormData,
  saleType: 'unica' | 'mensalidade'
): ValidationError[] => {
  const errors: ValidationError[] = [];

  console.log('[saleValidation] Validando formulário completo:', { saleType });

  // Validações obrigatórias
  if (!formData.client_id) errors.push({ field: 'client_id', message: 'Cliente não selecionado' });
  if (!formData.product_id) errors.push({ field: 'product_id', message: 'Produto não selecionado' });
  if (!formData.sales_stage_id) errors.push({ field: 'sales_stage_id', message: 'Etapa não selecionada' });
  if (!formData.payment_method_id) errors.push({ field: 'payment_method_id', message: 'Forma de pagamento não selecionada' });

  // Validações específicas por tipo
  if (saleType === 'unica') {
    const installments = parseInt(formData.installments) || 0;
    if (installments < 1) errors.push({ field: 'installments', message: 'Parcelas inválidas' });
    if (!formData.sale_date) errors.push({ field: 'sale_date', message: 'Data da venda obrigatória' });
    if (!formData.first_payment_date) errors.push({ field: 'first_payment_date', message: 'Data de vencimento obrigatória' });
  } else {
    if (!formData.start_date) errors.push({ field: 'start_date', message: 'Data de início obrigatória' });
    if (!formData.first_payment_due_date) errors.push({ field: 'first_payment_due_date', message: 'Data de pagamento obrigatória' });
  }

  return errors;
};
