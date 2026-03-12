import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchAddressByCEP, formatCEP } from '@/services/cepService';
import { Mail, Phone, MapPin, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          cep: (data as any).cep || '',
          street: (data as any).street || '',
          neighborhood: (data as any).neighborhood || '',
          city: (data as any).city || '',
          state: (data as any).state || '',
        });
      } catch {
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

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
          street: address.logradouro || '',
          neighborhood: address.bairro || '',
          city: address.localidade || '',
          state: address.uf || '',
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast.error('Email inválido');
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
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
          cep: cleanCep || null,
          street: formData.street || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
        } as any)
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
          <User className="h-6 w-6" /> Meu Perfil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Edite suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
          <CardDescription>Informações básicas da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Endereço
          </CardTitle>
          <CardDescription>Preencha o CEP para busca automática</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CEP</Label>
            <div className="flex items-center gap-2">
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

          <div className="space-y-2">
            <Label>Rua</Label>
            <Input value={formData.street} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input value={formData.neighborhood} disabled className="bg-muted" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={formData.city} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input value={formData.state} disabled className="bg-muted" />
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
