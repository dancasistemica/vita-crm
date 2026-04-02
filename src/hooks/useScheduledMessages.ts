import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface ScheduledMessage {
  id: string
  organization_id: string
  lead_id?: string
  client_id?: string
  phone_number: string
  message_text: string
  scheduled_at: string
  sent_at?: string
  status: 'pending' | 'scheduled' | 'sent' | 'failed' | 'cancelled'
  
  error_message?: string
  created_by: string
  created_at: string
  updated_at: string
  lead?: { id: string; name: string; phone: string }
  client?: { id: string; name: string; phone: string }
}

interface ScheduleMessagePayload {
  phoneNumber: string
  messageText: string
  scheduledAt: Date
  leadId?: string
  clientId?: string
}

export const useScheduledMessages = (organizationId: string | null) => {
  // TODOS os useState PRIMEIRO (antes de qualquer lógica)
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // DEPOIS as funções
  const loadMessages = useCallback(async () => {
    console.log('[useScheduledMessages.loadMessages] Iniciando carregamento')
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('scheduled_messages')
        .select(`
          *,
          lead:lead_id(id, name, phone),
          client:client_id(id, name, phone)
        `)
        .eq('organization_id', organizationId)
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })

      if (queryError) throw queryError

      console.log('[useScheduledMessages.loadMessages] Carregadas:', data?.length)
      setMessages((data || []) as ScheduledMessage[])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar'
      console.error('[useScheduledMessages.loadMessages] Erro:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const scheduleMessage = useCallback(
    async (payload: ScheduleMessagePayload): Promise<boolean> => {
      console.log('[useScheduledMessages.scheduleMessage] Agendando para:', payload.phoneNumber)
      setLoading(true)
      setError(null)

      try {
        const cleanPhone = payload.phoneNumber.replace(/\D/g, '')
        if (cleanPhone.length < 10) {
          throw new Error('Telefone inválido')
        }

        if (payload.scheduledAt <= new Date()) {
          throw new Error('Data deve ser no futuro')
        }

        if (!payload.messageText.trim()) {
          throw new Error('Mensagem obrigatória')
        }

        const user = await supabase.auth.getUser()
        if (!user.data.user?.id) {
          throw new Error('Usuário não autenticado')
        }

        const { data, error: insertError } = await supabase
          .from('scheduled_messages')
          .insert({
            organization_id: organizationId,
            lead_id: payload.leadId || null,
            client_id: payload.clientId || null,
            phone_number: `55${cleanPhone}`,
            message_text: payload.messageText.trim(),
            scheduled_at: payload.scheduledAt.toISOString(),
            status: 'pending',
            created_by: user.data.user.id,
          })
          .select()

        if (insertError) throw insertError

        console.log('[useScheduledMessages.scheduleMessage] Agendada:', data?.[0]?.id)
        setMessages([...messages, data[0] as ScheduledMessage])
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao agendar'
        console.error('[useScheduledMessages.scheduleMessage] Erro:', errorMsg)
        setError(errorMsg)
        return false
      } finally {
        setLoading(false)
      }
    },
    [organizationId, messages]
  )

  const cancelMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      console.log('[useScheduledMessages.cancelMessage] Cancelando:', messageId)
      setLoading(true)
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from('scheduled_messages')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', messageId)

        if (updateError) throw updateError

        setMessages(messages.filter(m => m.id !== messageId))
        console.log('[useScheduledMessages.cancelMessage] Cancelada')
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao cancelar'
        console.error('[useScheduledMessages.cancelMessage] Erro:', errorMsg)
        setError(errorMsg)
        return false
      } finally {
        setLoading(false)
      }
    },
    [messages]
  )

  // useEffect ÚLTIMO
  useEffect(() => {
    if (organizationId) {
      loadMessages()
      const interval = setInterval(loadMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [organizationId, loadMessages])

  return {
    messages,
    loading,
    error,
    scheduleMessage,
    cancelMessage,
    reload: loadMessages,
  }
}
