import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { Button } from '@/components/ui/ds';
import { Textarea } from '@/components/ui/ds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds';
import { Label } from '@/components/ui/ds';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';

interface Props {
  lead: Lead;
  stageName: string;
}

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram DM' },
];

export default function AIFollowUpGenerator({ lead, stageName }: Props) {
  const [channel, setChannel] = useState('whatsapp');
  const [message, setMessage] = useState('');
  const { loading, generate, regenerate } = useAI({ type: 'followup_message' });

  const handleGenerate = async () => {
    const prompt = `Gere uma mensagem de follow-up via ${CHANNELS.find(c => c.value === channel)?.label || channel} para:
- Nome: ${lead.name}
- Etapa do funil: ${stageName}
- Interesse: ${lead.interestLevel}
- Dor: ${lead.customData?.pain_point || 'não informada'}
- Objetivo emocional: ${lead.customData?.emotional_goal || 'não informado'}
- Canal: ${channel}`;

    const result = await generate(prompt);
    if (result) setMessage(result);
  };

  const handleRegenerate = async () => {
    const result = await regenerate();
    if (result) setMessage(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensagem copiada!');
  };

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">Gerar mensagem de follow-up</span>
        <span className="inline-flex items-center text-[10px] font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-full">✨ IA</span>
      </div>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label className="text-xs">Canal</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Gerando...' : '✨ Gerar mensagem'}
        </Button>
      </div>

      {message && (
        <div className="space-y-3 animate-in fade-in-50">
          <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="text-sm" />
          <div className="flex gap-3">
            <Button size="sm" variant="neutral" onClick={handleCopy}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</Button>
            <Button size="sm" variant="neutral" onClick={handleRegenerate} disabled={loading}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerar</Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Sugestão gerada por IA — revise antes de enviar</p>
        </div>
      )}
    </div>
  );
}
