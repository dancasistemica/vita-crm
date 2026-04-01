// Sanitizar inputs para prevenir XSS
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"']/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return escapeMap[char] || char;
    });
}

// Validar email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar telefone
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

// Validar URL
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validar comprimento de string
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number
): boolean {
  return value.length >= minLength && value.length <= maxLength;
}

// Rate limiting simples (client-side)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remover tentativas fora da janela de tempo
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      console.warn(`[RateLimiter] Limite excedido para: ${key}`);
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Criptografia simples para dados sensíveis em localStorage
export function encryptData(data: string, key: string): string {
  try {
    // Implementação simples com Base64 (para produção, usar crypto-js ou similar)
    return btoa(data);
  } catch (err) {
    console.error('[encryptData] Erro ao criptografar:', err);
    return '';
  }
}

export function decryptData(encrypted: string, key: string): string {
  try {
    return atob(encrypted);
  } catch (err) {
    console.error('[decryptData] Erro ao descriptografar:', err);
    return '';
  }
}

// Validar token JWT (básico)
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3; // JWT tem 3 partes: header.payload.signature
}

// Remover dados sensíveis de objetos
export function stripSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'anonKey',
    'refreshToken',
    'accessToken',
  ];

  const stripped = { ...obj };

  sensitiveKeys.forEach((key) => {
    if (key in stripped) {
      delete stripped[key];
    }
  });

  return stripped;
}
