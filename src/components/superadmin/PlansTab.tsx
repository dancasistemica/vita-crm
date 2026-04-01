import { Badge, Button, Card, Dialog, Input, Label, Select, Textarea } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAllPlans, createPlan, deletePlan } from '@/services/superadminService';
import { Plus, Trash2, Users, FileText, Link } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';

interface Plan {
  id: string;
  name: string;
  value: number;
  period: string;
  max_users: number;
  max_leads: number | null;
  max_integrations: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', value: '', period: 'monthly', max_users: '',
    max_leads: '', max_integrations: '', description: '',
  });

  const fetchPlans = async () => {
    try {
      setPlans(await getAllPlans() as any);
    } catch (err) {
      console.error('[PlansTab]', err);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.value || !form.max_users) {
      toast.error('Preencha nome, valor e máx. usuários');
      return;
    }
    try {
      await createPlan({
        name: form.name,
        value: parseFloat(form.value),
        period: form.period,
        max_users: parseInt(form.max_users),
        max_leads: form.max_leads ? parseInt(form.max_leads) : null,
        max_integrations: form.max_integrations ? parseInt(form.max_integrations) : null,
        description: form.description || null,
      });
      toast.success('Plano criado');
      setOpen(false);
      setForm({ name: '', value: '', period: 'monthly', max_users: '', max_leads: '', max_integrations: '', description: '' });
      fetchPlans();
    } catch (err) {
      console.error('[PlansTab] create:', err);
      toast.error('Erro ao criar plano');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  const handleDeleteConfirm = async () => {
    try {
      await deletePlan(deleteConfirm.id);
      toast.success('Plano deletado');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      fetchPlans();
    } catch (err) {
      console.error('[PlansTab] delete:', err);
      toast.error('Erro ao deletar plano');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-neutral-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <ConfirmDeleteDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.name}
        itemType="Plano"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                <Badge variant="secondary">
                  {plan.period === 'monthly' ? 'Mensal' : 'Anual'}
                </Badge>
              </div>
              {plan.description && (
                <p className="text-sm text-neutral-500">{plan.description}</p>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                R$ {Number(plan.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <span className="text-sm font-normal text-neutral-500">
                  /{plan.period === 'monthly' ? 'mês' : 'ano'}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-neutral-500" />
                  <span>Até {plan.max_users} usuários</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-neutral-500" />
                  <span>{plan.max_leads ? `Até ${plan.max_leads} leads` : 'Leads ilimitados'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link className="h-4 w-4 text-neutral-500" />
                  <span>{plan.max_integrations ? `Até ${plan.max_integrations} integrações` : 'Integrações ilimitadas'}</span>
                </div>
              </div>

              <Button variant="error" size="sm" className="w-full" onClick={() => setDeleteConfirm({ isOpen: true, id: plan.id, name: plan.name })}>
                <Trash2 className="h-4 w-4 mr-2" /> Deletar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Novo Plano</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pro" />
              </div>
              <div className="space-y-3">
                <Label>Valor (R$) *</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="99.90" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Período *</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  
                  
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                  
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Máx Usuários *</Label>
                <Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} placeholder="5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Máx Leads</Label>
                <Input type="number" value={form.max_leads} onChange={(e) => setForm({ ...form, max_leads: e.target.value })} placeholder="Ilimitado" />
              </div>
              <div className="space-y-3">
                <Label>Máx Integrações</Label>
                <Input type="number" value={form.max_integrations} onChange={(e) => setForm({ ...form, max_integrations: e.target.value })} placeholder="Ilimitado" />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do plano..." />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleCreate}>Criar Plano</Button>
          </div>
        
      </Dialog>
    </div>
  );
}
