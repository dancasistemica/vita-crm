import { useState } from 'react';
import { Mail } from 'lucide-react';
import EmailTemplateEditor from './EmailTemplateEditor';
import { Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/ds";

const TEMPLATE_OPTIONS = [
  { value: 'confirmation_email', label: '✉️ Confirmação de Email' },
  { value: 'reset_password', label: '🔑 Reset de Senha' },
] as const;

type TemplateType = 'confirmation_email' | 'reset_password';

export function EmailTemplatesTab() {
  const [selectedType, setSelectedType] = useState<TemplateType>('confirmation_email');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Email Templates</CardTitle>
        </div>
        <p className="text-sm text-neutral-500">
          Customize os templates de email enviados pelo sistema.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-xs">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as TemplateType)}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <EmailTemplateEditor key={selectedType} templateType={selectedType} />
      </CardContent>
    </Card>
  );
}
