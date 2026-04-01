import { useMemo } from 'react';

interface EmailPreviewProps {
  subject: string;
  bodyHtml: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  buttonText: string;
  buttonLink: string;
  footerText: string;
}

const SAMPLE_VARS: Record<string, string> = {
  '{{name}}': 'João Silva',
  '{{email}}': 'joao@example.com',
  '{{link}}': 'https://crm.dancasistemica.com.br/confirm?token=abc123',
  '{{organization_name}}': 'Dança Sistêmica',
  '{{crm_name}}': 'Vita CRM',
};

function replaceVars(text: string): string {
  let result = text;
  for (const [key, val] of Object.entries(SAMPLE_VARS)) {
    result = result.split(key).join(val);
  }
  return result;
}

export default function EmailPreview({
  subject,
  bodyHtml,
  logoUrl,
  primaryColor,
  secondaryColor,
  textColor,
  buttonText,
  buttonLink,
  footerText,
}: EmailPreviewProps) {
  const renderedHtml = useMemo(() => {
    const body = replaceVars(bodyHtml || 'Olá {{name}}, bem-vindo ao {{crm_name}}!');
    const btn = replaceVars(buttonText || 'Clique aqui');
    const link = replaceVars(buttonLink || '{{link}}');
    const footer = replaceVars(footerText || '');
    const subj = replaceVars(subject || '');

    return `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ${secondaryColor};border-radius:8px;overflow:hidden;">
        ${logoUrl ? `<div style="text-align:center;padding:24px 24px 0;"><img src="${logoUrl}" alt="Logo" style="max-height:60px;max-width:200px;" /></div>` : ''}
        <div style="padding:32px 24px;">
          <h2 style="color:${textColor};font-size:20px;margin:0 0 8px;">${subj}</h2>
          <div style="color:${textColor};font-size:14px;line-height:1.6;margin-bottom:24px;">${body}</div>
          <div style="text-align:center;">
            <a href="${link}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:14px;">${btn}</a>
          </div>
        </div>
        ${footer ? `<div style="background:${secondaryColor};padding:16px 24px;text-align:center;font-size:12px;color:${textColor}80;">${footer}</div>` : ''}
      </div>
    `;
  }, [subject, bodyHtml, logoUrl, primaryColor, secondaryColor, textColor, buttonText, buttonLink, footerText]);

  return (
    <div className="border rounded-lg overflow-hidden bg-muted/30 p-4">
      <p className="text-xs font-medium text-neutral-500 mb-3">📧 Preview do Email</p>
      <div
        className="bg-white rounded shadow-sm"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
