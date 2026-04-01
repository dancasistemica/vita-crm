import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchAddressByCEP, formatCEP } from '@/services/cepService';
import { formatCNPJ, validateCNPJ } from '@/utils/cnpjValidator';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui/ds";

export default function OrganizationPage() {
  const { user } = useAuth();
  const { organization, organizationId, refetch } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: '',
    cnpj: '',
    description: '',
    website: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    estado: '',
  });

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast.error('Organização não encontrada');
          setLoading(false);
          return;
        }

        setFormData({
          name: data.name || '',
          contact_email: data.contact_email || '',
          phone: data.phone || '',
          cnpj: data.cnpj || '',
          description: data.description || '',
          website: data.website || '',
          cep: data.cep ? formatCEP(data.cep) : '',
          rua: data.rua || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          estado: data.estado || '',
        });
      } catch {
        toast.error('Erro ao carregar dados da organização');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId]);

  const handleCEPChange = async (value: string) => {
    const formatted = formatCEP(value);
    setFormData((prev) => ({ ...prev, cep: formatted }));

    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      setCepLoading(true);
      const address = await fetchAddressByCEP(clean);
      setCepLoading(false);

      if (address) {
        setFormData((prev) => ({
          ...prev,
          rua: address.logradouro || '',
          bairro: address.bairro || '',
          municipio: address.localidade || '',
          estado: address.uf || '',
        }));
      }
    }
  };

  const handleCNPJChange = (value: string) => {
    setFormData((prev) => ({ ...prev, cnpj: formatCNPJ(value) }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact_email && !emailRegex.test(formData.contact_email)) {
      toast.error('Email inválido');
      return;
    }

    const cleanCnpj = formData.cnpj.replace(/\D/g, '');
    if (cleanCnpj && !validateCNPJ(cleanCnpj)) {
      toast.error('CNPJ inválido');
      return;
    }

    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep && cleanCep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          contact_email: formData.contact_email || null,
          phone: formData.phone || null,
          cnpj: cleanCnpj || null,
          description: formData.description || null,
          website: formData.website || null,
          cep: cleanCep || null,
          rua: formData.rua || null,
          numero: formData.numero || null,
          complemento: formData.complemento || null,
          bairro: formData.bairro || null,
          municipio: formData.municipio || null,
          estado: formData.estado || null,
        })
        .eq('id', organizationId!);

      if (error) throw error;

      toast.success('Dados da organização atualizados!');
      refetch();
    } catch {
      toast.error('Erro ao salvar dados da organização');
    } finally {
      setSaving(false);
    }
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Nenhuma organização vinculada à sua conta.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900">
          <Building2 className="h-6 w-6" /> Dados da Organização
        </h1>
        <p className="text-neutral-500 text-sm mt-1">Edite as informações da sua empresa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
          <CardDescription>Nome, contato e documentação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Nome da Empresa *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="space-y-3">
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Breve descrição da empresa"
            />
          </div>

          <div className="space-y-3">
            <Label>CNPJ</Label>
            <Input
              value={formData.cnpj}
              onChange={(e) => handleCNPJChange(e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email de Contato
            </Label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData((p) => ({ ...p, contact_email: e.target.value }))}
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Telefone
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-3">
            <Label>Website</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://www.empresa.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <MapPin className="h-5 w-5" /> Endereço
          </CardTitle>
          <CardDescription>Preencha o CEP para busca automática</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>CEP</Label>
            <div className="flex items-center gap-3">
              <Input
                value={formData.cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="max-w-[200px]"
              />
              {cepLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Rua</Label>
            <Input value={formData.rua} disabled className="bg-muted" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))}
                placeholder="Nº"
              />
            </div>
            <div className="space-y-3">
              <Label>Complemento</Label>
              <Input
                value={formData.complemento}
                onChange={(e) => setFormData((p) => ({ ...p, complemento: e.target.value }))}
                placeholder="Sala, andar..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Bairro</Label>
            <Input value={formData.bairro} disabled className="bg-muted" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Cidade</Label>
              <Input value={formData.municipio} disabled className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label>Estado</Label>
              <Input value={formData.estado} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );
}
