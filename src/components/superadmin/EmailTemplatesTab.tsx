import { Card, Select } from "@/components/ui/ds";
import { useState } from 'react';
import { Mail } from 'lucide-react';
import EmailTemplateEditor from './EmailTemplateEditor';

const TEMPLATE_OPTIONS = [
  { value: 'confirmation_email', label: '✉️ Confirmação de Email' },
  { value: 'reset_password', label: '🔑 Reset de Senha' },
] as const;

type TemplateType = 'confirmation_email' | 'reset_password';

export function EmailTemplatesTab() {
  const [selectedType, setSelectedType] = useState<TemplateType>('confirmation_email');

  return (
    <Card>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Email Templates</h2>
        </div>
        <p className="text-sm text-neutral-500">
          Customize os templates de email enviados pelo sistema.
        </p>
      </div>
      <div>
        <div className="max-w-xs">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as TemplateType)}>
            
              
            
            
              {TEMPLATE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            
          </Select>
        </div>

        <EmailTemplateEditor key={selectedType} templateType={selectedType} />
      </div>
    </Card>
  );
}
