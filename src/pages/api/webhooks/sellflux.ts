/**
 * ATENÇÃO: Este projeto utiliza Supabase Edge Functions para endpoints de Webhook.
 * O endpoint real está implantado em: /functions/v1/sellflux-webhook
 * 
 * Este arquivo serve como referência e para compatibilidade com o plano de implementação original.
 */

import { handleSellfluxWebhook } from '../../../api/webhooks/sellfluxWebhook';

// Mock de um handler de API (estilo Next.js) que o usuário solicitou
// Em um ambiente Vite puro, este arquivo não será executado como endpoint automaticamente.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const organizationId = req.query.org_id; // Assume que o ID da org vem via query param
    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization_id' });
    }

    const result = await handleSellfluxWebhook(organizationId, req.body);
    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error('[sellflux-api] ❌ Erro:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
