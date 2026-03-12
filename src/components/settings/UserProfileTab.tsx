import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { fetchAddressByCEP, formatCEP } from '@/services/cepService';
import { formatCPF, validateCPF } from '@/services/cpfValidator';
import { Mail, Phone, MapPin, Camera, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin',
  owner: 'Proprietário',
  admin: 'Administrador',
  vendedor: 'Vendedor',
  member: 'Usuário',
};

export default function UserProfileTab() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', avatar_url: '',
    cpf: '', cep: '', street: '', neighborhood: '', city: '', state: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) throw error;
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          cpf: (data as any).cpf ? formatCPF((data as any).cpf) : '',
          cep: data.cep || '',
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
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
    setFormData(prev => ({ ...prev, cep: formatted }));
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      setCepLoading(true);
      const address = await fetchAddressByCEP(clean);
      setCepLoading(false);
      if (address) {
        setFormData(prev => ({
          ...prev,
          street: address.logradouro || '',
          neighborhood: address.bairro || '',
          city: address.localidade || '',
          state: address.uf || '',
        }));
      }
    }
  };

  const handleCPFChange = (value: string) => {
    setFormData(prev => ({ ...prev, cpf: formatCPF(value) }));
  };

  const processFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemovePhoto = async () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (user?.id) {
      await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() } as any).eq('id', user.id);
      toast.success('Foto removida');
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile || !user?.id) return null;
    setUploading(true);
    setUploadProgress(30);
    const ext = selectedFile.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    setUploadProgress(60);
    const { error } = await supabase.storage.from('profile-avatars').upload(path, selectedFile, { upsert: true });
    if (error) { setUploading(false); setUploadProgress(0); throw new Error('Erro ao fazer upload da foto'); }
    setUploadProgress(90);
    const { data: urlData } = supabase.storage.from('profile-avatars').getPublicUrl(path);
    setUploadProgress(100);
    setUploading(false);
    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) { toast.error('Nome completo é obrigatório'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) { toast.error('Email inválido'); return; }
    const cleanCpf = formData.cpf.replace(/\D/g, '');
    if (cleanCpf && !validateCPF(cleanCpf)) { toast.error('CPF inválido'); return; }
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep && cleanCep.length !== 8) { toast.error('CEP deve ter 8 dígitos'); return; }

    try {
      setSaving(true);
      let avatarUrl = formData.avatar_url;
      if (selectedFile) { const uploaded = await uploadAvatar(); if (uploaded) avatarUrl = uploaded; }
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name, email: formData.email, phone: formData.phone,
        avatar_url: avatarUrl || null, cpf: cleanCpf || null, updated_at: new Date().toISOString(),
        cep: cleanCep || null, street: formData.street || null, neighborhood: formData.neighborhood || null,
        city: formData.city || null, state: formData.state || null,
      } as any).eq('id', user!.id);
      if (error) throw error;
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
      setSelectedFile(null); setPreviewUrl(null); setUploadProgress(0);
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  const displayAvatar = previewUrl || formData.avatar_url;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto de Perfil</CardTitle>
          <CardDescription>JPG, PNG ou WebP — máx 2MB</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className={`relative group cursor-pointer rounded-full ${isDragging ? 'ring-4 ring-primary ring-offset-2' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-28 w-28">
              {displayAvatar ? <AvatarImage src={displayAvatar} alt="Avatar" /> : null}
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {formData.full_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-7 w-7 text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-1" /> Alterar Foto
            </Button>
            {(displayAvatar) && (
              <Button variant="outline" size="sm" onClick={handleRemovePhoto}>
                <Trash2 className="h-4 w-4 mr-1" /> Remover
              </Button>
            )}
          </div>
          {previewUrl && <p className="text-xs text-muted-foreground">Nova foto selecionada. Clique em Salvar para aplicar.</p>}
          {uploading && <Progress value={uploadProgress} className="w-48 h-2" />}
        </CardContent>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
            <Input type="email" value={formData.email} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Telefone</Label>
            <Input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input value={formData.cpf} onChange={e => handleCPFChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div className="space-y-2">
            <Label>Função Atual</Label>
            <Badge variant="secondary" className="text-sm">{roleLabels[role || 'member'] || role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereço</CardTitle>
          <CardDescription>Preencha o CEP para busca automática</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CEP</Label>
            <div className="flex items-center gap-2">
              <Input value={formData.cep} onChange={e => handleCEPChange(e.target.value)} placeholder="00000-000" maxLength={9} className="max-w-[200px]" />
              {cepLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />}
            </div>
          </div>
          <div className="space-y-2"><Label>Rua</Label><Input value={formData.street} disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label>Bairro</Label><Input value={formData.neighborhood} disabled className="bg-muted" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Cidade</Label><Input value={formData.city} disabled className="bg-muted" /></div>
            <div className="space-y-2"><Label>Estado</Label><Input value={formData.state} disabled className="bg-muted" /></div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || uploading} className="w-full sm:w-auto">
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );
}
