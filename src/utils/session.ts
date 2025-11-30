/**
 * Session Management - UUID de sessão com expiração de 1 dia
 * 
 * Gera e mantém um UUID único para rastrear usuários por sessão diária
 */

import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'weather_session_id';
const SESSION_EXPIRY_KEY = 'weather_session_expiry';
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 dia em milissegundos

/**
 * Obtém o session_id atual ou cria um novo se expirado
 */
export function getSessionId(): string {
  try {
    const now = Date.now();
    const existingId = localStorage.getItem(SESSION_KEY);
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

    // Verifica se existe sessão válida
    if (existingId && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (now < expiryTime) {
        return existingId; // Sessão ainda válida
      }
    }

    // Criar nova sessão
    const newSessionId = uuidv4();
    const newExpiry = (now + ONE_DAY_MS).toString();

    localStorage.setItem(SESSION_KEY, newSessionId);
    localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry);

    return newSessionId;
  } catch (error) {
    // Fallback se localStorage não disponível (modo privado)
    console.warn('localStorage não disponível, gerando session_id temporário');
    return uuidv4();
  }
}

/**
 * Limpa a sessão atual (útil para testes ou logout)
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch (error) {
    console.warn('Erro ao limpar sessão:', error);
  }
}

/**
 * Obtém informações sobre a sessão atual
 */
export function getSessionInfo(): {
  sessionId: string;
  expiresAt: Date | null;
  isValid: boolean;
} {
  const sessionId = getSessionId();
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  const expiryTime = expiry ? parseInt(expiry, 10) : null;
  const expiresAt = expiryTime ? new Date(expiryTime) : null;
  const isValid = expiryTime ? Date.now() < expiryTime : false;

  return {
    sessionId,
    expiresAt,
    isValid,
  };
}
