import { Button, useCallback, useEffect, useState } from 'react';
import { Button, supabase } from '@/integrations/supabase/client';
import { Button, Input } from '@/components/ui/ds';
import { Button, Textarea } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Button, Label } from '@/components/ui/ds';
import { Button, toast } from 'sonner';
import EmailPreview from './EmailPreview';
import { Button, Save, RotateCcw, Loader2 } from 'lucide-react';

interface EmailTemplateData {
  id?: string;
  template_type: string;
  subject: string;
  body_html: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  button_text: string;
  button_link: string;
  footer_text: string;
}

const DEFAULTS: Record<string, EmailTemplateData> = {
  confirmation_email: {
    template_type: 'confirmation_email',
    subject: 'Confirme seu email em {{crm_name}}',
    body_html: '<p>Olá <strong>{{name}}</strong>,</p><p>Obrigado por se cadastrar no {{crm_name}}! Clique no botão abaixo para confirmar seu endereço de email.</p><p>Se você não criou uma conta, ignore este email.</p>',
    logo_url: null,
    primary_color: '#3b82f6',
    secondary_color: '#e5e7eb',
    text_color: '#1f2937',
    button_text: 'Confirmar Email',
    button_link: '{{link}}',
    footer_text: '© {{crm_name}} - Todos os direitos reservados',
  },
  reset_password: {
    template_type: 'reset_password',
    subject: 'Redefinir sua senha em {{crm_name}}',
    body_html: '<p>Olá <strong>{{name}}</strong>,</p><p>Recebemos uma solicitação para redefinir sua senha no {{crm_name}}. Clique no botão abaixo para criar uma nova senha.</p><p>Se você não solicitou isso, ignore este email. O link expira em 1 hora.</p>',
    logo_url: null,
    primary_color: '#3b82f6',
    secondary_color: '#e5e7eb',
    text_color: '#1f2937',
    button_text: 'Redefinir Senha',
    button_link: '{{link}}',
    footer_text: '© {{crm_name}} - Todos os direitos reservados',
  },
};

const VARIABLES = [
  { Button, key: '{{name}}', desc: 'Nome do usuário' },
  { Button, key: '{{email}}', desc: 'Email do usuário' },
  { Button, key: '{{link}}', desc: 'Link de ação' },
  { Button, key: '{{organization_name}}', desc: 'Nome da organização' },
  { Button, key: '{{crm_name}}', desc: 'Nome do CRM' },
];

interface Props {
  templateType: 'confirmation_email' | 'reset_password';
}

export default function EmailTemplateEditor({ Button, templateType }: Props) {
  const [form, setForm] = useState<EmailTemplateData>(DEFAULTS[templateType]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isCustom, setIsCustom] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[EmailTemplateEditor] Loading template:', templateType);
      const { Button, data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .is('organization_id', null)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('[EmailTemplateEditor] Loaded custom template');
        setForm({
          id: data.id,
          template_type: data.template_type,
          subject: data.subject,
          body_html: data.body_html,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          text_color: data.text_color,
          button_text: data.button_text,
          button_link: data.button_link,
          footer_text: data.footer_text,
        });
        setIsCustom(true);
      } else {
        console.log('[EmailTemplateEditor] Using default template');
        setForm(DEFAULTS[templateType]);
        setIsCustom(false);
      }
    } catch (err) {
      console.error('[EmailTemplateEditor] Load error:', err);
      toast.error('Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  }, [templateType]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const updateField = (field: keyof EmailTemplateData, value: string | null) => {
    setForm(prev => ({ Button, ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!form.subject || form.subject.length < 5) return 'Assunto deve ter no mínimo 5 caracteres';
    if (form.subject.length > 100) return 'Assunto deve ter no máximo 100 caracteres';
    if (!form.body_html || form.body_html.length < 20) return 'Corpo do email deve ter no mínimo 20 caracteres';
    if (!/^#[0-9a-fA-F]{6}$/.test(form.primary_color)) return 'Cor primária inválida (use #RRGGBB)';
    if (!/^#[0-9a-fA-F]{6}$/.test(form.secondary_color)) return 'Cor secundária inválida (use #RRGGBB)';
    if (!/^#[0-9a-fA-F]{6}$/.test(form.text_color)) return 'Cor do texto inválida (use #RRGGBB)';
    if (!form.button_text) return 'Texto do botão é obrigatório';
    if (form.button_text.length > 50) return 'Texto do botão deve ter no máximo 50 caracteres';
    if (form.footer_text.length > 200) return 'Rodapé deve ter no máximo 200 caracteres';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { Button, toast.error(error); return; }
    setSaving(true);
    try {
      console.log('[EmailTemplateEditor] Saving template:', templateType);
      const payload = {
        organization_id: null as string | null,
        template_type: form.template_type,
        subject: form.subject,
        body_html: form.body_html,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        text_color: form.text_color,
        button_text: form.button_text,
        button_link: form.button_link,
        footer_text: form.footer_text,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { Button, error } = await supabase
          .from('email_templates')
          .update(payload)
          .eq('id', form.id);
        if (error) throw error;
      } else {
        const { Button, data, error } = await supabase
          .from('email_templates')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setForm(prev => ({ Button, ...prev, id: data.id }));
      }
      setIsCustom(true);
      toast.success('Template salvo com sucesso!');
      console.log('[EmailTemplateEditor] Template saved');
    } catch (err) {
      console.error('[EmailTemplateEditor] Save error:', err);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!form.id) return;
    setSaving(true);
    try {
      console.log('[EmailTemplateEditor] Restoring default');
      const { Button, error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', form.id);
      if (error) throw error;
      setForm(DEFAULTS[templateType]);
      setIsCustom(false);
      toast.success('Template restaurado ao padrão!');
    } catch (err) {
      console.error('[EmailTemplateEditor] Restore error:', err);
      toast.error('Erro ao restaurar template');
    } finally {
      setSaving(false);
    }
  };


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use PNG, JPG ou SVG.');
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error('Arquivo muito grande. Máximo 512KB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `email-logos/${Date.now()}.${ext}`;
      console.log('[EmailTemplateEditor] Uploading logo:', path);

      const { Button, error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { Button, upsert: true });

      if (uploadError) throw uploadError;

      const { Button, data: { Button, publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(path);

      updateField('logo_url', publicUrl);
      toast.success('Logo enviado com sucesso!');
    } catch (err) {
      console.error('[EmailTemplateEditor] Upload error:', err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${isCustom ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {isCustom ? '✏️ Customizado' : '📋 Padrão'}
          </span>
        </div>

        {/* Variables reference */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Variáveis disponíveis:</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map(v => (
              <span key={v.key} className="text-xs bg-background border rounded px-2 py-0.5 font-mono" title={v.desc}>
                {v.key}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Assunto</Label>
            <Input
              value={form.subject}
              onChange={e => updateField('subject', e.target.value)}
              placeholder="Assunto do email"
              maxLength={100}
              className="min-h-[44px]"
            />
            <span className="text-xs text-muted-foreground">{form.subject.length}/100</span>
          </div>

          <div>
            <Label>Logo do Email</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="min-h-[44px]"
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {form.logo_url && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.logo_url} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                <Button variant="ghost" size="sm" onClick={() => updateField('logo_url', null)}>Remover</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cor do Botão</Label>
              <div className="flex gap-1.5">
                <input type="color" value={form.primary_color} onChange={e => updateField('primary_color', e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                <Input value={form.primary_color} onChange={e => updateField('primary_color', e.target.value)} className="min-h-[44px] font-mono text-xs" maxLength={7} />
              </div>
            </div>
            <div>
              <Label>Cor Secundária</Label>
              <div className="flex gap-1.5">
                <input type="color" value={form.secondary_color} onChange={e => updateField('secondary_color', e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                <Input value={form.secondary_color} onChange={e => updateField('secondary_color', e.target.value)} className="min-h-[44px] font-mono text-xs" maxLength={7} />
              </div>
            </div>
            <div>
              <Label>Cor do Texto</Label>
              <div className="flex gap-1.5">
                <input type="color" value={form.text_color} onChange={e => updateField('text_color', e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                <Input value={form.text_color} onChange={e => updateField('text_color', e.target.value)} className="min-h-[44px] font-mono text-xs" maxLength={7} />
              </div>
            </div>
          </div>

          <div>
            <Label>Texto do Botão</Label>
            <Input
              value={form.button_text}
              onChange={e => updateField('button_text', e.target.value)}
              placeholder="Confirmar Email"
              maxLength={50}
              className="min-h-[44px]"
            />
          </div>

          <div>
            <Label>Corpo do Email (HTML)</Label>
            <Textarea
              value={form.body_html}
              onChange={e => updateField('body_html', e.target.value)}
              placeholder="Use variáveis como {{name}}, {{link}}, {{crm_name}}..."
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <Label>Rodapé</Label>
            <Input
              value={form.footer_text}
              onChange={e => updateField('footer_text', e.target.value)}
              placeholder="© {{crm_name}} - Todos os direitos reservados"
              maxLength={200}
              className="min-h-[44px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="min-h-[44px] gap-3">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Template
          </Button>
          {isCustom && (
            <Button variant="neutral" onClick={handleRestore} disabled={saving} className="min-h-[44px] gap-3">
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrão
            </Button>
          )}
          {/* TODO: Reativar quando integrar provedor de email */}
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-4">
        <EmailPreview
          subject={form.subject}
          bodyHtml={form.body_html}
          logoUrl={form.logo_url}
          primaryColor={form.primary_color}
          secondaryColor={form.secondary_color}
          textColor={form.text_color}
          buttonText={form.button_text}
          buttonLink={form.button_link}
          footerText={form.footer_text}
        />
      </div>
    </div>
  );
}
