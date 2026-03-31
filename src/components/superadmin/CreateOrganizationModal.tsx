import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Input } from '@/components/ui/ds';
import { Label } from '@/components/ui/ds';
import { Textarea } from '@/components/ui/ds';
import { Card } from '@/components/ui/ds';
import { Badge } from '@/components/ui/ds';
import { createOrganization } from '@/services/organizationService';
import { Building2, Users, FileText, Check, Copy } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  value: number;
  period: string;
  max_users: number;
  max_leads: number | null;
  max_integrations: number | null;
  description: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plans: Plan[];
}

export function CreateOrganizationModal({ open, onOpenChange, onSuccess, plans }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ temp_password: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    phone: '',
    website: '',
    description: '',
    plan_id: '',
    admin_name: '',
    admin_email: '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const resetAndClose = () => {
    setStep(1);
    setForm({ name: '', contact_email: '', phone: '', website: '', description: '', plan_id: '', admin_name: '', admin_email: '' });
    setResult(null);
    onOpenChange(false);
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.name.trim()) { toast.error('Nome da organização é obrigatório'); return false; }
      if (!form.contact_email.trim() || !form.contact_email.includes('@')) { toast.error('Email de contato válido é obrigatório'); return false; }
    }
    if (step === 2) {
      if (!form.plan_id) { toast.error('Selecione um plano'); return false; }
    }
    if (step === 3) {
      if (!form.admin_name.trim()) { toast.error('Nome do admin é obrigatório'); return false; }
      if (!form.admin_email.trim() || !form.admin_email.includes('@')) { toast.error('Email do admin válido é obrigatório'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handlePrev = () => setStep(s => s - 1);

  const handleCreate = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const res = await createOrganization({
        name: form.name,
        contact_email: form.contact_email,
        phone: form.phone,
        website: form.website,
        description: form.description,
        plan_id: form.plan_id,
        admin_name: form.admin_name,
        admin_email: form.admin_email,
      });
      setResult({ temp_password: res.temp_password });
      setStep(4); // success step
      toast.success('Organização criada com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error('[CreateOrganizationModal]', err);
      toast.error(err.message || 'Erro ao criar organização');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (result?.temp_password) {
      navigator.clipboard.writeText(result.temp_password);
      toast.success('Senha copiada!');
    }
  };

  const selectedPlan = plans.find(p => p.id === form.plan_id);

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5" /> Nova Organização
          </DialogTitle>
          <DialogDescription>
            {step <= 3 ? `Passo ${step} de 3` : 'Concluído'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        {step <= 3 && (
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        {/* Step 1: Org Data */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Nome da Organização *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Clínica Wellness" />
            </div>
            <div>
              <Label>Email de Contato *</Label>
              <Input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(11) 98765-4321" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Descrição breve..." rows={2} />
            </div>
          </div>
        )}

        {/* Step 2: Plan Selection */}
        {step === 2 && (
          <div className="space-y-3">
            {plans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano cadastrado. Crie um plano na aba "Planos" primeiro.</p>
            )}
            {plans.map(plan => (
              <Card
                key={plan.id}
                onClick={() => update('plan_id', plan.id)}
                className={`p-4 cursor-pointer transition-all ${form.plan_id === plan.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {plan.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">/{plan.period === 'monthly' ? 'mês' : 'ano'}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>👥 {plan.max_users} usuários</span>
                  <span>📋 {plan.max_leads || '∞'} leads</span>
                  <span>🔗 {plan.max_integrations || '∞'} integrações</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Admin User */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              Este usuário será o administrador (owner) da organização. Uma senha temporária será gerada automaticamente.
            </div>
            <div>
              <Label>Nome do Admin *</Label>
              <Input value={form.admin_name} onChange={e => update('admin_name', e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Email do Admin *</Label>
              <Input type="email" value={form.admin_email} onChange={e => update('admin_email', e.target.value)} placeholder="admin@empresa.com" />
            </div>

            {/* Summary */}
            <div className="border rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium mb-2 flex items-center gap-1"><FileText className="h-4 w-4" /> Resumo</p>
              <p><span className="text-muted-foreground">Organização:</span> {form.name}</p>
              <p><span className="text-muted-foreground">Plano:</span> {selectedPlan?.name}</p>
              <p><span className="text-muted-foreground">Admin:</span> {form.admin_name} ({form.admin_email})</p>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && result && (
          <div className="space-y-4 text-center py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Organização criada!</p>
              <p className="text-sm text-muted-foreground mt-1">Compartilhe as credenciais com o admin</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-left space-y-3 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {form.admin_email}</p>
              <div className="flex items-center justify-between">
                <p><span className="text-muted-foreground">Senha:</span> <code className="bg-background px-2 py-0.5 rounded">{result.temp_password}</code></p>
                <Button variant="ghost" size="sm" onClick={copyPassword}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <Badge variant="neutral" className="text-xs">O admin deve trocar a senha no primeiro acesso</Badge>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-2">
          {step <= 3 ? (
            <>
              <Button variant="neutral" onClick={step === 1 ? resetAndClose : handlePrev} disabled={loading}>
                {step === 1 ? 'Cancelar' : '← Anterior'}
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext}>Próximo →</Button>
              ) : (
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Organização'}
                </Button>
              )}
            </>
          ) : (
            <Button className="w-full" onClick={resetAndClose}>Fechar</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
