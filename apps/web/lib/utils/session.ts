/**
 * Gera ou recupera um session_id único para identificar o carrinho de visitantes
 * Persiste no localStorage para manter consistência entre recarregamentos
 *
 * Formato: session_<timestamp>_<random>
 * - Persistido em localStorage com chave 'cart-session-id'
 * - Reutilizado entre sessões do mesmo navegador
 * - Não expira (até limpar localStorage)
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // SSR: retorna um ID temporário (será substituído no cliente)
    return 'temp-session-id'
  }

  const STORAGE_KEY = 'cart-session-id'
  let sessionId = localStorage.getItem(STORAGE_KEY)

  if (!sessionId || sessionId.trim() === '') {
    // Gera um ID único: session_<timestamp>_<random>
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(STORAGE_KEY, sessionId)
  }

  return sessionId
}

