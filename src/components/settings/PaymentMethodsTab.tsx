import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Switch } from "@/components/ui/ds";

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
  order_index: number;
}

export default function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newMethod, setNewMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('[PaymentMethodsTab] Erro:', error);
      toast.error('Erro ao carregar formas de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMethod.trim()) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{ 
          name: newMethod.trim(), 
          order_index: paymentMethods.length,
          active: true 
        }])
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods([...paymentMethods, data]);
      setNewMethod('');
      toast.success('Forma de pagamento adicionada');
    } catch (error) {
      console.error('[PaymentMethodsTab] Erro ao adicionar:', error);
      toast.error('Erro ao adicionar forma de pagamento');
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Deseja excluir "${method.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', method.id);

      if (error) throw error;

      setPaymentMethods(paymentMethods.filter(m => m.id !== method.id));
      toast.success('Excluída com sucesso');
    } catch (error) {
      console.error('[PaymentMethodsTab] Erro ao excluir:', error);
      toast.error('Erro ao excluir forma de pagamento');
    }
  };

  const handleEditSave = async (method: PaymentMethod) => {
    if (!editingMethod || !editingMethod.name.trim()) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ name: editingMethod.name.trim() })
        .eq('id', method.id);

      if (error) throw error;

      setPaymentMethods(paymentMethods.map(m => m.id === method.id ? editingMethod : m));
      setEditingMethod(null);
      toast.success('Atualizada');
    } catch (error) {
      console.error('[PaymentMethodsTab] Erro ao editar:', error);
      toast.error('Erro ao atualizar forma de pagamento');
    }
  };

  const handleToggle = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ active: !method.active })
      .eq('id', method.id);

    if (error) {
      console.error('[PaymentMethodsTab] Erro ao ativar/desativar:', error);
      toast.error('Erro ao atualizar forma de pagamento');
      return;
    }
    setPaymentMethods((prev) => prev.map((m) => (m.id === method.id ? { ...m, active: !m.active } : m)));
    toast.success(method.active ? "Desativada" : "Ativada");
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    // Persist order logic could be added here
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Adicionar Nova Forma de Pagamento</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Ex: Pix, Cartão Crédito, Boleto..."
              value={newMethod}
              onChange={e => setNewMethod(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!newMethod.trim() || loading}>
              <Plus className="h-4 w-4 mr-1" />Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Formas de Pagamento Cadastradas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <p className="text-sm text-neutral-500 text-center py-4">Carregando formas de pagamento...</p>
          )}
          {!loading && paymentMethods.map((m, index) => (
            <div
              key={m.id}
              className={`flex flex-col gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100 sm:flex-row sm:items-center sm:justify-between ${dragIndex === index ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="cursor-grab text-neutral-400">
                  <GripVertical className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-neutral-500 w-6">{index + 1}.</span>
                  {editingMethod?.id === m.id ? (
                    <Input
                      value={editingMethod.name}
                      onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleEditSave(m)}
                      className="h-8 flex-1"
                    />
                  ) : (
                    <span className="text-neutral-900 font-medium flex-1">{m.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="flex items-center gap-3">
                    <Switch checked={m.active} onCheckedChange={() => handleToggle(m)} />
                    <span className={`text-xs font-medium ${m.active ? 'text-primary-600' : 'text-neutral-500'}`}>
                      {m.active ? '✓ Ativo' : '✗ Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {editingMethod?.id === m.id ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => handleEditSave(m)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditingMethod(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditingMethod(m)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 text-error-600" onClick={() => handleDelete(m)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!loading && paymentMethods.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-4">Nenhuma forma de pagamento cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
