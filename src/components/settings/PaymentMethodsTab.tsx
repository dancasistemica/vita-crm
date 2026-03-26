import { useState } from "react";
import { useCRMStore, PaymentMethod } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowDown, ArrowUp, Check, Edit, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function PaymentMethodsTab() {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, removePaymentMethod, reorderPaymentMethods } = useCRMStore();
  const [newMethod, setNewMethod] = useState('');
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const handleAdd = () => {
    if (!newMethod.trim()) return;
    const exists = paymentMethods.some(m => m.name.toLowerCase() === newMethod.trim().toLowerCase());
    if (exists) {
      toast.error("Forma de pagamento já existe!");
      return;
    }
    addPaymentMethod({ id: crypto.randomUUID(), name: newMethod.trim(), active: true });
    setNewMethod('');
    toast.success("Forma de pagamento adicionada");
    console.log('[PaymentMethodsTab] Adicionada:', newMethod.trim());
  };

  const handleEditSave = (method: PaymentMethod) => {
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
    updatePaymentMethod(method.id, { name: nextName });
    setEditingMethod(null);
    toast.success("Forma de pagamento atualizada");
    console.log('[PaymentMethodsTab] Atualizada:', nextName);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    reorderPaymentMethods(index, nextIndex);
  };

  const handleDelete = (method: PaymentMethod) => {
    removePaymentMethod(method.id);
    toast.success("Forma de pagamento removida");
    console.log('[PaymentMethodsTab] Removida:', method.name);
  };

  const handleToggle = (method: PaymentMethod) => {
    updatePaymentMethod(method.id, { active: !method.active });
    toast.success(method.active ? "Desativada" : "Ativada");
    console.log('[PaymentMethodsTab] Toggle:', method.name, !method.active);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Adicionar Nova Forma de Pagamento</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Pix, Cartão Crédito, Boleto..."
              value={newMethod}
              onChange={e => setNewMethod(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!newMethod.trim()}>
              <Plus className="h-4 w-4 mr-1" />Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Formas de Pagamento Cadastradas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {paymentMethods.map((m, index) => (
            <div key={m.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-medium text-muted-foreground w-6">{index + 1}.</span>
                {editingMethod?.id === m.id ? (
                  <Input
                    value={editingMethod.name}
                    onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave(m)}
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="text-foreground font-medium flex-1">{m.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === paymentMethods.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={m.active} onCheckedChange={() => handleToggle(m)} />
                  <span className={`text-xs font-medium ${m.active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {m.active ? '✓ Ativo' : '✗ Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {editingMethod?.id === m.id ? (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditSave(m)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingMethod(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingMethod(m)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma forma de pagamento cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
