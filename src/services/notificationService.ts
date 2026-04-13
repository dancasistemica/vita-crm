export interface NotificationOptions {
  to: string;
  subject: string;
  body: string;
  type: 'email' | 'whatsapp' | 'system';
}

export const sendNotification = async (options: NotificationOptions): Promise<boolean> => {
  try {
    console.log(`[notificationService] Enviando notificação para ${options.to}:`, options);
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log(`[notificationService] ✅ Notificação enviada com sucesso (${options.type})`);
    return true;
  } catch (error) {
    console.error('[notificationService] ❌ Erro ao enviar notificação:', error);
    return false;
  }
};

export const sendChurnAlertEmail = async (clientName: string, clientEmail: string, absences: number): Promise<boolean> => {
  const options: NotificationOptions = {
    to: clientEmail,
    subject: `Importante: Sentimos sua falta em nossas aulas!`,
    body: `Olá ${clientName}, notamos que você não compareceu e não assistiu às últimas ${absences} aulas. Alguma coisa aconteceu? Queremos te ajudar a continuar sua jornada!`,
    type: 'email'
  };
  
  return sendNotification(options);
};

export const sendInternalAlert = async (userName: string, clientName: string, absences: number): Promise<boolean> => {
  const options: NotificationOptions = {
    to: userName,
    subject: `ALERTA DE CHURN: ${clientName}`,
    body: `O cliente ${clientName} atingiu ${absences} faltas reais consecutivas e está com alto risco de churn.`,
    type: 'system'
  };
  
  return sendNotification(options);
};
