import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Textarea } from "@/components/ui/ds";
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useScheduledMessages, ScheduledMessage } from '@/hooks/useScheduledMessages';

interface RecipientRef {
  id: string;
  name: string;
  phone: string;
}

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: RecipientRef;
  client?: RecipientRef;
  onScheduled?: () => void;
}

const normalizePhone = (value: string) => value.replace(/\D/g, '');

export const ScheduleMessageDialog = ({
  open,
  onOpenChange,
  lead,
  client,
  onScheduled,
}: ScheduleMessageDialogProps) => {
  const { organizationId } = useOrganization();
  const { scheduleMessage } = useScheduledMessages(organizationId);
  const [messageText, setMessageText] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipient = lead || client;
  const recipientType = lead ? 'lead' : 'client';

  const handleSchedule = async () => {
    if (!messageText.trim()) {
      setError('Mensagem não pode estar vazia');
      return;
    }

    if (!recipient?.phone) {
      setError('Telefone do destinatário não encontrado');
      return;
    }

    const normalizedPhone = normalizePhone(recipient.phone);
    if (normalizedPhone.length < 8) {
      setError('Telefone do destinatário inválido');
      return;
    }

    const [hours, minutes] = scheduledTime.split(':');
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(Number(hours), Number(minutes), 0, 0);

    if (scheduledDateTime <= new Date()) {
      setError('Agendamento deve ser para uma data/hora futura');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('[ScheduleMessageDialog] Agendamento validado');

    try {
      await scheduleMessage({
        leadId: recipientType === 'lead' ? lead?.id : undefined,
        clientId: recipientType === 'client' ? client?.id : undefined,
        phoneNumber: normalizedPhone,
        messageText: messageText.trim(),
        scheduledAt: scheduledDateTime,
      });

      toast.success('Mensagem agendada com sucesso!');
      onScheduled?.();
      onOpenChange(false);
      setMessageText('');
      setScheduledDate(new Date());
      setScheduledTime('09:00');
    } catch (err) {
      setError('Erro ao agendar mensagem');
      console.error('[ScheduleMessageDialog]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Mensagem WhatsApp</DialogTitle>
          <DialogDescription>
            Para: {recipient?.name} ({recipient?.phone})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="mt-2 min-h-[120px]"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {messageText.length} caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate.toISOString().split('T')[0]}
              onChange={(e) => setScheduledDate(new Date(e.target.value))}
              className="mt-2"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="time">Hora</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-2"
            />
          </div>

          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <div className="bg-muted p-3 rounded text-sm">
            <p className="font-semibold mb-2">Preview:</p>
            <p className="text-neutral-500 whitespace-pre-wrap">{messageText || '(vazio)'}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="min-h-[44px]">
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={loading} className="min-h-[44px]">
            {loading ? 'Agendando...' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
