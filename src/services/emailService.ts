import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
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

const DEFAULT_TEMPLATES: Record<string, EmailTemplate> = {
  confirmation_email: {
    subject: 'Confirme seu email em {{crm_name}}',
    body_html: '<p>Olá <strong>{{name}}</strong>,</p><p>Obrigado por se cadastrar no {{crm_name}}! Clique no botão abaixo para confirmar seu endereço de email.</p>',
    logo_url: null,
    primary_color: '#3b82f6',
    secondary_color: '#e5e7eb',
    text_color: '#1f2937',
    button_text: 'Confirmar Email',
    button_link: '{{link}}',
    footer_text: '© {{crm_name}} - Todos os direitos reservados',
  },
  reset_password: {
    subject: 'Redefinir sua senha em {{crm_name}}',
    body_html: '<p>Olá <strong>{{name}}</strong>,</p><p>Recebemos uma solicitação para redefinir sua senha no {{crm_name}}. Clique no botão abaixo para criar uma nova senha.</p>',
    logo_url: null,
    primary_color: '#3b82f6',
    secondary_color: '#e5e7eb',
    text_color: '#1f2937',
    button_text: 'Redefinir Senha',
    button_link: '{{link}}',
    footer_text: '© {{crm_name}} - Todos os direitos reservados',
  },
};

function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return result;
}

function buildEmailHtml(template: EmailTemplate, variables: Record<string, string>): string {
  const subject = replaceVariables(template.subject, variables);
  const body = replaceVariables(template.body_html, variables);
  const buttonText = replaceVariables(template.button_text, variables);
  const buttonLink = replaceVariables(template.button_link, variables);
  const footer = replaceVariables(template.footer_text, variables);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:${template.secondary_color};font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${template.secondary_color};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        ${template.logo_url ? `<tr><td style="padding:24px;text-align:center;"><img src="${template.logo_url}" alt="Logo" style="max-height:48px;max-width:200px;" /></td></tr>` : ''}
        <tr><td style="padding:32px;color:${template.text_color};font-size:16px;line-height:1.6;">${body}</td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="${buttonLink}" style="display:inline-block;padding:14px 32px;background-color:${template.primary_color};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">${buttonText}</a>
        </td></tr>
        <tr><td style="padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const emailService = {
  replaceVariables,

  async getEmailTemplate(templateType: string): Promise<EmailTemplate> {
    console.log('[emailService] Buscando template:', templateType);

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .is('organization_id', null)
      .maybeSingle();

    if (error) {
      console.error('[emailService] Erro ao buscar template:', error);
      throw error;
    }

    if (data) {
      console.log('[emailService] Template customizado encontrado');
      return {
        subject: data.subject,
        body_html: data.body_html,
        logo_url: data.logo_url,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        text_color: data.text_color,
        button_text: data.button_text,
        button_link: data.button_link,
        footer_text: data.footer_text,
      };
    }

    console.log('[emailService] Usando template padrão');
    return DEFAULT_TEMPLATES[templateType] ?? DEFAULT_TEMPLATES.confirmation_email;
  },

  async sendTestEmail(templateType: string, recipientEmail: string): Promise<void> {
    console.log('[emailService] Enviando email de teste:', templateType, 'para:', recipientEmail);

    const template = await this.getEmailTemplate(templateType);

    const variables: Record<string, string> = {
      name: 'Usuário Teste',
      email: recipientEmail,
      link: `${window.location.origin}/confirm?token=test-preview`,
      organization_name: 'Minha Organização',
      crm_name: 'Vita CRM',
      current_year: new Date().getFullYear().toString(),
    };

    const html = buildEmailHtml(template, variables);
    const subject = replaceVariables(template.subject, variables);

    console.log('[emailService] HTML gerado, invocando edge function...');

    const { error } = await supabase.functions.invoke('send-test-email', {
      body: { to: recipientEmail, subject, html },
    });

    if (error) {
      console.error('[emailService] Erro na edge function:', error);
      throw error;
    }

    console.log('[emailService] Email de teste enviado com sucesso!');
  },
};
