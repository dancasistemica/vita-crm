import { useMemo } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useScheduledMessages, ScheduledMessage } from '@/hooks/useScheduledMessages';

interface ScheduledMessagesListProps {
  organizationId: string | null;
  leadId?: string;
  clientId?: string;
}

export const ScheduledMessagesList = ({ organizationId, leadId, clientId }: ScheduledMessagesListProps) => {
  const { messages, loading, cancelMessage } = useScheduledMessages(organizationId);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (leadId && m.lead_id !== leadId) return false;
      if (clientId && m.client_id !== clientId) return false;
      return true;
    });
  }, [messages, leadId, clientId]);

  const pendingMessages = filteredMessages.filter(
    m => m.status === 'pending' || m.status === 'scheduled'
  );
  const sentMessages = filteredMessages.filter(m => m.status === 'sent');
  const failedMessages = filteredMessages.filter(m => m.status === 'failed');

  const getRecipientName = (msg: ScheduledMessage) => {
    return msg.lead?.name || msg.client?.name || 'Desconhecido';
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">⏳ Pendente</Badge>;
      case 'sent':
        return <Badge variant="default">✓ Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">✗ Falha</Badge>;
      default:
        return <Badge>{status || '—'}</Badge>;
    }
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
      {pendingMessages.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Mensagens Pendentes ({pendingMessages.length})</h3>
          <div className="space-y-2">
            {pendingMessages.map(msg => (
              <div key={msg.id} className="border rounded-lg p-3 hover:bg-muted/50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getRecipientName(msg)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.message_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(msg.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(msg.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => cancelMessage(msg.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentMessages.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Enviadas ({sentMessages.length})</h3>
          <div className="space-y-2">
            {sentMessages.map(msg => (
              <div key={msg.id} className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getRecipientName(msg)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.message_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        Enviado em {formatDateTime(msg.sent_at)}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(msg.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {failedMessages.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Falhas ({failedMessages.length})</h3>
          <div className="space-y-2">
            {failedMessages.map(msg => (
              <div key={msg.id} className="border rounded-lg p-3 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getRecipientName(msg)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.message_text}</p>
                    {msg.error_message && (
                      <p className="text-xs text-red-600 mt-2">Erro: {msg.error_message}</p>
                    )}
                  </div>
                  {getStatusBadge(msg.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredMessages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma mensagem agendada</p>
        </div>
      )}
    </div>
  );
};
