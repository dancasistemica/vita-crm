import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui/ds";
import { 
  createFinancialTransaction, 
  updateFinancialTransaction, 
  FinancialCategory, 
  FinancialSubcategory, 
  FinancialTransaction,
  getFinancialSubcategories
} from '@/services/financialService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface FinancialTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: FinancialTransaction;
  categories: FinancialCategory[];
}

export const FinancialTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  transaction,
  categories 
}: FinancialTransactionModalProps) => {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<FinancialSubcategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'despesa' as 'receita' | 'despesa',
    category_id: '',
    subcategory_id: '',
    due_date: new Date().toISOString().split('T')[0],
    payment_date: '',
    status: 'pendente' as 'pendente' | 'pago' | 'atrasado' | 'cancelado',
    payment_method_id: '',
    supplier_client_name: '',
    notes: '',
  });

  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!organizationId) return;
      const { data } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('active', true);
      if (data) setPaymentMethods(data);
    };
    loadPaymentMethods();
  }, [organizationId]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category_id: transaction.category_id || '',
        subcategory_id: transaction.subcategory_id || '',
        due_date: transaction.due_date,
        payment_date: transaction.payment_date || '',
        status: transaction.status,
        payment_method_id: transaction.payment_method_id || '',
        supplier_client_name: transaction.supplier_client_name || '',
        notes: transaction.notes || '',
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: 'despesa',
        category_id: '',
        subcategory_id: '',
        due_date: new Date().toISOString().split('T')[0],
        payment_date: '',
        status: 'pendente',
        payment_method_id: '',
        supplier_client_name: '',
        notes: '',
      });
    }
  }, [transaction, isOpen]);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (formData.category_id) {
        try {
          const subs = await getFinancialSubcategories(formData.category_id);
          setSubcategories(subs);
        } catch (error) {
          console.error('Erro ao carregar subcategorias:', error);
        }
      } else {
        setSubcategories([]);
      }
    };
    loadSubcategories();
  }, [formData.category_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    if (!formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        organization_id: organizationId,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || undefined,
        subcategory_id: formData.subcategory_id || undefined,
        payment_method_id: formData.payment_method_id || undefined,
        payment_date: formData.payment_date || null,
      };

      if (transaction) {
        await updateFinancialTransaction(transaction.id, payload);
        toast.success('Transação atualizada!');
      } else {
        await createFinancialTransaction(payload);
        toast.success('Transação criada!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: 'receita' | 'despesa') => setFormData({ ...formData, type: val, category_id: '', subcategory_id: '' })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita (A receber)</SelectItem>
                  <SelectItem value="despesa">Despesa (A pagar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago / Recebido</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Aluguel de Maio, Venda de Produto X..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(val) => setFormData({ ...formData, category_id: val, subcategory_id: '' })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Select 
                value={formData.subcategory_id} 
                onValueChange={(val) => setFormData({ ...formData, subcategory_id: val })}
                disabled={!formData.category_id}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_client_name">{formData.type === 'receita' ? 'Cliente' : 'Fornecedor'}</Label>
              <Input
                id="supplier_client_name"
                value={formData.supplier_client_name}
                onChange={(e) => setFormData({ ...formData, supplier_client_name: e.target.value })}
                placeholder="Nome..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select 
                value={formData.payment_method_id} 
                onValueChange={(val) => setFormData({ ...formData, payment_method_id: val })}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Data de Pagamento</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalhes adicionais..."
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {transaction ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
