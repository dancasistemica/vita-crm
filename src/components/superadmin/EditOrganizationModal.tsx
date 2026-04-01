import { Button, Checkbox, Dialog, Input, Label, Select, Separator, Textarea } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { updateOrganization } from '@/services/superadminService';
import { supabase } from '@/integrations/supabase/client';
import { fetchAddressByCEP, formatCEP } from '@/services/cepService';
import { validateCNPJWithResult, formatCNPJ, type CNPJValidationResult } from '@/utils/cnpjValidator';
import { generatePassword, evaluatePasswordStrength, type PasswordStrength } from '@/utils/passwordGenerator';
import { Eye, EyeOff, RefreshCw, Loader2, XCircle } from 'lucide-react';

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
  onSuccess: () => void;
}

const UF_OPTIONS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','TO'];

export function EditOrganizationModal({ open, onOpenChange, orgId, onSuccess }: EditOrganizationModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [cnpjValidation, setCnpjValidation] = useState<CNPJValidationResult>({ valid: true });
  const [cnpjTouched, setCnpjTouched] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    phone: '',
    website: '',
    description: '',
    cnpj: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    estado: '',
    senhaAdmin: '',
    senhaManual: false,
  });

  useEffect(() => {
    if (!open || !orgId) return;
    setLoading(true);
    setPasswordStrength(null);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name, contact_email, phone, website, description, cnpj, cep, rua, numero, complemento, bairro, municipio, estado')
          .eq('id', orgId)
          .single();
        if (error) throw error;
        setForm({
          name: (data as any).name || '',
          contact_email: (data as any).contact_email || '',
          phone: (data as any).phone || '',
          website: (data as any).website || '',
          description: (data as any).description || '',
          cnpj: (data as any).cnpj || '',
          cep: (data as any).cep || '',
          rua: (data as any).rua || '',
          numero: (data as any).numero || '',
          complemento: (data as any).complemento || '',
          bairro: (data as any).bairro || '',
          municipio: (data as any).municipio || '',
          estado: (data as any).estado || '',
          senhaAdmin: '',
          senhaManual: false,
        });
      } catch (err) {
        console.error('[EditOrganizationModal] Load error:', err);
        toast.error('Erro ao carregar organização');
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, orgId]);

  const handleCEPBlur = async () => {
    const cleanCEP = form.cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    setLoadingCEP(true);
    try {
      const address = await fetchAddressByCEP(form.cep);
      if (address) {
        setForm(prev => ({
          ...prev,
          rua: address.logradouro || prev.rua,
          bairro: address.bairro || prev.bairro,
          municipio: address.localidade || prev.municipio,
          estado: address.uf || prev.estado,
        }));
      }
    } finally {
      setLoadingCEP(false);
    }
  };

  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setForm(prev => ({ ...prev, senhaAdmin: pwd }));
    setPasswordStrength(evaluatePasswordStrength(pwd));
    toast.success('Senha gerada');
  };

  const handlePasswordChange = (value: string) => {
    setForm(prev => ({ ...prev, senhaAdmin: value }));
    setPasswordStrength(value ? evaluatePasswordStrength(value) : null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (form.cnpj) {
      const result = validateCNPJWithResult(form.cnpj);
      if (!result.valid) {
        setCnpjTouched(true);
        setCnpjValidation(result);
        toast.error(result.error || 'CNPJ inválido');
        return;
      }
    }
    if (form.senhaAdmin && form.senhaAdmin.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (!orgId) return;

    setSaving(true);
    try {
      // 1. Update organization data
      const updateData: Record<string, any> = {
        name: form.name,
        contact_email: form.contact_email || null,
        phone: form.phone || null,
        website: form.website || null,
        description: form.description || null,
        cnpj: form.cnpj || null,
        cep: form.cep || null,
        rua: form.rua || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        municipio: form.municipio || null,
        estado: form.estado || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('organizations')
        .update(updateData as any)
        .eq('id', orgId);

      if (error) throw error;

      // 2. Update admin password if provided
      if (form.senhaAdmin) {
        console.log('[EditOrganizationModal] Updating admin password via edge function');
        const { data: fnData, error: fnError } = await supabase.functions.invoke('update-admin-password', {
          body: { organization_id: orgId, new_password: form.senhaAdmin },
        });

        if (fnError) {
          console.error('[EditOrganizationModal] Password update error:', fnError);
          toast.error('Organização salva, mas erro ao atualizar senha do admin');
        } else if (fnData?.error) {
          toast.error(fnData.error);
        } else {
          toast.success('Organização e senha do admin atualizadas');
          onSuccess();
          onOpenChange(false);
          return;
        }
      }

      toast.success('Organização atualizada');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('[EditOrganizationModal] Save error:', err);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Organização</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-neutral-500">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700">Dados Básicos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={set('name')} />
                </div>
                <div className="space-y-3">
                  <Label>CNPJ</Label>
                  <div className="relative">
                    <Input
                      value={form.cnpj}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }));
                        if (cnpjTouched) {
                          setCnpjValidation(validateCNPJWithResult(formatCNPJ(e.target.value)));
                        }
                      }}
                      onBlur={() => {
                        if (form.cnpj) {
                          setCnpjTouched(true);
                          setCnpjValidation(validateCNPJWithResult(form.cnpj));
                        }
                      }}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className={cnpjTouched && !cnpjValidation.valid ? 'border-destructive bg-destructive/5 pr-10' : ''}
                    />
                    {cnpjTouched && !cnpjValidation.valid && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {cnpjTouched && !cnpjValidation.valid && (
                    <p className="text-xs text-destructive">{cnpjValidation.error}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Email de Contato</Label>
                  <Input type="email" value={form.contact_email} onChange={set('contact_email')} />
                </div>
                <div className="space-y-3">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={set('phone')} placeholder="(11) 98765-4321" />
                </div>
                <div className="space-y-3">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={set('website')} placeholder="https://empresa.com" />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Descrição</Label>
                <Textarea rows={2} value={form.description} onChange={set('description')} />
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700">Endereço</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>
                    CEP {loadingCEP && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
                  </Label>
                  <Input
                    value={form.cep}
                    onChange={(e) => setForm(prev => ({ ...prev, cep: formatCEP(e.target.value) }))}
                    onBlur={handleCEPBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={loadingCEP}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Rua/Avenida</Label>
                  <Input value={form.rua} onChange={set('rua')} disabled={loadingCEP} />
                </div>
                <div className="space-y-3">
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={set('numero')} placeholder="123" />
                </div>
                <div className="space-y-3">
                  <Label>Complemento</Label>
                  <Input value={form.complemento} onChange={set('complemento')} placeholder="Apto 101" />
                </div>
                <div className="space-y-3">
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={set('bairro')} disabled={loadingCEP} />
                </div>
                <div className="space-y-3">
                  <Label>Município</Label>
                  <Input value={form.municipio} onChange={set('municipio')} disabled={loadingCEP} />
                </div>
                <div className="space-y-3">
                  <Label>Estado (UF)</Label>
                  <Select value={form.estado || undefined} onValueChange={(v) => setForm(prev => ({ ...prev, estado: v }))}>
                    <SelectTrigger disabled={loadingCEP}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Senha do Admin */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-700">Senha do Admin</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.senhaAdmin}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
                    />
                    <Button variant="secondary" size="sm"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleGeneratePassword} className="gap-1 shrink-0">
                    <RefreshCw className="h-4 w-4" /> Gerar
                  </Button>
                </div>

                {passwordStrength && (
                  <div className="flex items-center gap-3">
                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength.color}`} />
                    <span className="text-xs font-medium text-neutral-500">{passwordStrength.label}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="manual-pwd"
                    checked={form.senhaManual}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, senhaManual: !!v }))}
                  />
                  <Label htmlFor="manual-pwd" className="text-sm cursor-pointer">Definir senha manualmente</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading || (cnpjTouched && !cnpjValidation.valid)}
            title={cnpjTouched && !cnpjValidation.valid ? 'Corrija os erros antes de salvar' : ''}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
