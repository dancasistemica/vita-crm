// Regras para identificar clientes em risco de churn

export const CHURN_RULES = {
  // Cliente sem acesso há 7 dias
  NO_ACCESS_7_DAYS: {
    name: 'Sem acesso por 7 dias',
    days: 7,
    severity: 'medium' as const,
    action: 'contact_required',
  },

  // Cliente sem acesso há 14 dias
  NO_ACCESS_14_DAYS: {
    name: 'Sem acesso por 14 dias',
    days: 14,
    severity: 'high' as const,
    action: 'urgent_contact',
  },

  // Cliente sem acesso há 21 dias
  NO_ACCESS_21_DAYS: {
    name: 'Sem acesso por 21 dias',
    days: 21,
    severity: 'critical' as const,
    action: 'critical_intervention',
  },

  // Taxa de presença caiu abaixo de 30%
  LOW_ATTENDANCE_RATE: {
    name: 'Taxa de presença baixa',
    threshold: 30,
    severity: 'medium' as const,
    action: 'contact_required',
  },

  // Não participa do grupo WhatsApp há 7 dias
  NO_GROUP_PARTICIPATION: {
    name: 'Sem participação no grupo',
    days: 7,
    severity: 'low' as const,
    action: 'soft_contact',
  },

  // Vigência vencida
  EXPIRED_MEMBERSHIP: {
    name: 'Vigência vencida',
    severity: 'critical' as const,
    action: 'renewal_contact',
  },

  // Pagamento pendente há mais de 7 dias
  OVERDUE_PAYMENT: {
    name: 'Pagamento vencido',
    days: 7,
    severity: 'high' as const,
    action: 'payment_contact',
  },
};

export const CHURN_ACTIONS = {
  soft_contact: {
    name: 'Contato Suave',
    description: 'Mensagem amigável via WhatsApp/Email',
    priority: 'low',
    template: 'Oi! Sentimos sua falta nas aulas. Tudo bem? 💫',
  },
  contact_required: {
    name: 'Contato Necessário',
    description: 'Contato direto para entender o motivo',
    priority: 'medium',
    template: 'Notamos que você não participa há um tempo. Podemos ajudar?',
  },
  urgent_contact: {
    name: 'Contato Urgente',
    description: 'Contato prioritário com oferta de suporte',
    priority: 'high',
    template: 'Estamos preocupados com você. Como podemos ajudar?',
  },
  critical_intervention: {
    name: 'Intervenção Crítica',
    description: 'Contato imediato com Tiago (gestor)',
    priority: 'critical',
    template: 'Você está em risco de perder acesso. Vamos conversar?',
  },
  renewal_contact: {
    name: 'Contato de Renovação',
    description: 'Oferecer renovação de plano',
    priority: 'high',
    template: 'Sua vigência venceu. Vamos renovar?',
  },
  payment_contact: {
    name: 'Contato de Pagamento',
    description: 'Cobrar pagamento pendente',
    priority: 'high',
    template: 'Seu pagamento está pendente. Podemos ajudar?',
  },
};

export function getChurnSeverityColor(severity: string) {
  switch (severity) {
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-neutral-100 text-neutral-800 border-neutral-300';
  }
}

export function getChurnSeverityLabel(severity: string) {
  switch (severity) {
    case 'low':
      return 'Baixo';
    case 'medium':
      return 'Médio';
    case 'high':
      return 'Alto';
    case 'critical':
      return 'Crítico';
    default:
      return 'Desconhecido';
  }
}
