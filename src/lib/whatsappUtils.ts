// Gerar link WhatsApp Web
export function generateWhatsAppLink(phone: string, message?: string): string {
  // Remover caracteres especiais do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validar se tem código de país (Brasil = 55)
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  // Codificar mensagem
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  // Retornar link WhatsApp Web
  if (encodedMessage) {
    return `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
  }
  return `https://wa.me/${phoneWithCountry}`;
}

// Validar telefone
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10;
}

// Formatar telefone para exibição
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    // Formato: (XX) XXXXX-XXXX
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  } else if (cleanPhone.length === 10) {
    // Formato: (XX) XXXX-XXXX
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  return phone;
}
