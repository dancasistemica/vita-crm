import { 
  syncCustomerFromSellflux, 
  syncOrderFromSellflux, 
  syncSubscriptionFromSellflux 
} from '../../services/sellfluxService';

/**
 * Logica de processamento de Webhook da SellFlux.
 * Esta lógica pode ser chamada a partir de uma Edge Function ou de um endpoint de API.
 * 
 * @param organizationId ID da organização no CRM
 * @param payload Payload recebido do webhook da SellFlux
 */
export const handleSellfluxWebhook = async (organizationId: string, payload: any) => {
  console.log('[sellfluxWebhook] 📦 Processando payload para org:', organizationId);
  
  const event = payload.event || payload.type;
  const data = payload.data || payload;

  if (!event) {
    throw new Error('Evento não especificado no payload do webhook');
  }

  switch (event) {
    case 'customer.created':
    case 'customer.updated':
    case 'contact.created':
    case 'contact.updated':
      console.log('[sellfluxWebhook] 👤 Evento de Cliente detectado');
      return await syncCustomerFromSellflux(organizationId, data);

    case 'order.created':
    case 'order.paid':
    case 'order.updated':
    case 'sale.created':
      console.log('[sellfluxWebhook] 💰 Evento de Venda detectado');
      return await syncOrderFromSellflux(organizationId, data);

    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.paid':
    case 'subscription.active':
      console.log('[sellfluxWebhook] 🔁 Evento de Assinatura detectado');
      return await syncSubscriptionFromSellflux(organizationId, data);

    default:
      console.log(`[sellfluxWebhook] ℹ️ Evento '${event}' não possui tratamento específico.`);
      return { message: 'Evento ignorado', event };
  }
};
