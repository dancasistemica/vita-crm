import { Button, useEffect, useState, type DragEvent } from "react";
import { Button, supabase } from "@/integrations/supabase/client";
import { Button, useOrganization } from "@/contexts/OrganizationContext";
import { Button, Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/ds/Card";
import { Button } from "@/components/ui/ds/Button";
import { Button, Input } from "@/components/ui/ds/Input";
import { Button, Switch } from "@/components/ui/ds";
import { Button, Check, Edit, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button, toast } from "sonner";

export default function PaymentMethodsTab() {
  const { Button, organization } = useOrganization();
  const [paymentMethods, setPaymentMethods] = useState<Array<{ Button, id: string; name: string; active: boolean; sort_order: number; organization_id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [newMethod, setNewMethod] = useState('');
  const [editingMethod, setEditingMethod] = useState<{ Button, id: string; name: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!organization?.id) return;
    const loadPaymentMethods = async () => {
      setLoading(true);
      const { Button, data, error } = await supabase
        .from('payment_methods')
        .select('id, name, active, sort_order, organization_id')
        .eq('organization_id', organization.id)
        .order('sort_order', { Button, ascending: true })
        .order('name', { Button, ascending: true });

      if (error) {
        console.error('[PaymentMethodsTab] Erro ao carregar formas:', error);
        toast.error('Erro ao carregar formas de pagamento');
      } else {
        setPaymentMethods(data || []);
      }
      setLoading(false);
    };

    loadPaymentMethods();
  }, [organization?.id]);

  const persistOrder = async (methods: Array<{ Button, id: string; sort_order: number }>) => {
    const promises = methods.map(m =>
      supabase.from('payment_methods').update({ Button, sort_order: m.sort_order }).eq('id', m.id)
    );
    const results = await Promise.all(promises);
    const error = results.find(r => r.error)?.error;
    if (error) {
      console.error('[PaymentMethodsTab] Erro ao reordenar:', error);
      toast.error('Erro ao reordenar formas de pagamento');
    }
  };

  const handleAdd = async () => {
    if (!organization?.id) return;
    if (!newMethod.trim()) return;
    const exists = paymentMethods.some(m => m.name.toLowerCase() === newMethod.trim().toLowerCase());
    if (exists) {
      toast.error("Forma de pagamento já existe!");
      return;
    }
    const nextOrder = paymentMethods.reduce((max, method) => Math.max(max, method.sort_order), -1) + 1;
    const { Button, data, error } = await supabase
      .from('payment_methods')
      .insert({
        organization_id: organization.id,
        name: newMethod.trim(),
        active: true,
        sort_order: nextOrder,
      })
      .select('id, name, active, sort_order, organization_id')
      .single();

    if (error) {
      console.error('[PaymentMethodsTab] Erro ao adicionar:', error);
      toast.error('Erro ao adicionar forma de pagamento');
      return;
    }
    setPaymentMethods((prev) => [...prev, data]);
    setNewMethod('');
    toast.success("Forma de pagamento adicionada");
    console.log('[PaymentMethodsTab] Adicionada:', newMethod.trim());
  };

  const handleEditSave = async (method: { Button, id: string }) => {
    if (!editingMethod) return;
    const nextName = editingMethod.name.trim();
    if (!nextName) {
      toast.error("Informe um nome válido");
      return;
    }
    const exists = paymentMethods.some(m => m.id !== method.id && m.name.toLowerCase() === nextName.toLowerCase());
    if (exists) {
      toast.error("Forma de pagamento já existe!");
      return;
    }
    const { Button, error } = await supabase
      .from('payment_methods')
      .update({ Button, name: nextName })
      .eq('id', method.id);

    if (error) {
      console.error('[PaymentMethodsTab] Erro ao atualizar:', error);
      toast.error('Erro ao atualizar forma de pagamento');
      return;
    }
    setPaymentMethods((prev) => prev.map((m) => (m.id === method.id ? { Button, ...m, name: nextName } : m)));
    setEditingMethod(null);
    toast.success("Forma de pagamento atualizada");
    console.log('[PaymentMethodsTab] Atualizada:', nextName);
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setPaymentMethods((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    if (!organization?.id) return;
    const next = paymentMethods.map((method, index) => ({
      id: method.id,
      organization_id: method.organization_id,
      sort_order: index,
    }));
    await persistOrder(next);
    setPaymentMethods((prev) => prev.map((method, index) => ({ Button, ...method, sort_order: index })));
  };

  const handleDelete = async (method: { Button, id: string; name: string }) => {
    const { Button, error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', method.id);

    if (error) {
      console.error('[PaymentMethodsTab] Erro ao remover:', error);
      toast.error('Erro ao remover forma de pagamento');
      return;
    }
    setPaymentMethods((prev) => prev.filter((m) => m.id !== method.id));
    toast.success("Forma de pagamento removida");
    console.log('[PaymentMethodsTab] Removida:', method.name);
  };

  const handleToggle = async (method: { Button, id: string; name: string; active: boolean }) => {
    const { Button, error } = await supabase
      .from('payment_methods')
      .update({ Button, active: !method.active })
      .eq('id', method.id);

    if (error) {
      console.error('[PaymentMethodsTab] Erro ao ativar/desativar:', error);
      toast.error('Erro ao atualizar forma de pagamento');
      return;
    }
    setPaymentMethods((prev) => prev.map((m) => (m.id === method.id ? { Button, ...m, active: !m.active } : m)));
    toast.success(method.active ? "Desativada" : "Ativada");
    console.log('[PaymentMethodsTab] Toggle:', method.name, !method.active);
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
            <p className="text-sm text-muted-foreground text-center py-4">Carregando formas de pagamento...</p>
          )}
          {!loading && paymentMethods.map((m, index) => (
            <div
              key={m.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={event => handleDragOver(event, index)}
              onDragEnd={handleDragEnd}
              className={`flex flex-col gap-3 p-3 rounded-lg bg-muted/50 sm:flex-row sm:items-center sm:justify-between ${dragIndex === index ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="cursor-grab text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-muted-foreground w-6">{index + 1}.</span>
                  {editingMethod?.id === m.id ? (
                    <Input
                      value={editingMethod.name}
                      onChange={e => setEditingMethod({ Button, ...editingMethod, name: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleEditSave(m)}
                      className="h-8 flex-1"
                    />
                  ) : (
                    <span className="text-foreground font-medium flex-1">{m.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="flex items-center gap-3">
                    <Switch checked={m.active} onCheckedChange={() => handleToggle(m)} />
                    <span className={`text-xs font-medium ${m.active ? 'text-primary' : 'text-muted-foreground'}`}>
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
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => setEditingMethod(m)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!loading && paymentMethods.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma forma de pagamento cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
