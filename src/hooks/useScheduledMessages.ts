import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMessage {
  id: string;
  organization_id: string;
  lead_id: string | null;
  client_id: string | null;
  phone_number: string;
  message_text: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  error_message: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  lead?: { id: string; name: string; phone: string | null } | null;
  client?: { id: string; name: string; phone: string | null } | null;
}

const normalizePhone = (value: string) => value.replace(/\D/g, '');

export const useScheduledMessages = (organizationId: string | null) => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScheduledMessages = async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('scheduled_messages')
      .select(`
        *,
        lead:lead_id(id, name, phone),
        client:client_id(id, name, phone)
      `)
      .eq('organization_id', organizationId)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[ScheduledMessages] Erro ao carregar:', error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessages((data as ScheduledMessage[]) || []);
    setLoading(false);
    console.log('[ScheduledMessages] Carregadas:', data?.length);
  };

  const scheduleMessage = async (payload: {
    leadId?: string;
    clientId?: string;
    phoneNumber: string;
    messageText: string;
    scheduledAt: Date;
  }) => {
    if (!organizationId) {
      throw new Error('OrganizationId não encontrado');
    }

    const normalizedPhone = normalizePhone(payload.phoneNumber);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('scheduled_messages')
      .insert({
        organization_id: organizationId,
        lead_id: payload.leadId || null,
        client_id: payload.clientId || null,
        phone_number: normalizedPhone,
        message_text: payload.messageText,
        scheduled_at: payload.scheduledAt.toISOString(),
        status: 'pending',
        created_by: authData.user.id,
      })
      .select();

    if (error) {
      console.error('[ScheduledMessages] Erro ao agendar:', error);
      throw error;
    }

    const created = (data as ScheduledMessage[])[0];
    setMessages(prev => [...prev, created]);
    console.log('[ScheduledMessages] Mensagem agendada:', created.id);
    return created;
  };

  const cancelMessage = async (messageId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ScheduledMessages] Cancelando mensagem:', messageId);

      const { error: updateError } = await supabase
        .from('scheduled_messages')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (updateError) throw updateError;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      console.log('[ScheduledMessages] Mensagem cancelada e removida da lista');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar';
      setError(errorMessage);
      console.error('[ScheduledMessages] Erro ao cancelar:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async (messageId: string, updates: Partial<ScheduledMessage>) => {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .update(updates)
      .eq('id', messageId)
      .select();

    if (error) {
      console.error('[ScheduledMessages] Erro ao atualizar:', error);
      throw error;
    }

    const updated = (data as ScheduledMessage[])[0];
    setMessages(prev => prev.map(m => (m.id === messageId ? updated : m)));
    console.log('[ScheduledMessages] Mensagem atualizada:', messageId);
  };

  useEffect(() => {
    if (!organizationId) return;
    loadScheduledMessages();
    const interval = setInterval(loadScheduledMessages, 30000);
    return () => clearInterval(interval);
  }, [organizationId]);

  return {
    messages,
    loading,
    scheduleMessage,
    cancelMessage,
    updateMessage,
    reload: loadScheduledMessages,
    error,
  };
};
