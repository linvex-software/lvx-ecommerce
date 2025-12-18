import { useAuthStore } from '@/lib/store/useAuthStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Variáveis para controlar refresh token em andamento
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Função auxiliar para obter token do localStorage (sem causar hydration issues)
function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
        const authStorage = localStorage.getItem('auth-storage')
        if (!authStorage) return null
        const parsed = JSON.parse(authStorage)
        return parsed?.state?.accessToken || null
    } catch {
        return null
    }
}

// Função auxiliar para atualizar token no store
function updateAccessToken(accessToken: string, customer: any): void {
    if (typeof window === 'undefined') return
    try {
        // Usar o store do Zustand para atualizar
        useAuthStore.getState().setAuth(accessToken, customer)
    } catch {
        // Ignorar erros ao atualizar
    }
}

// Função auxiliar para limpar autenticação
function clearAuth(): void {
    if (typeof window === 'undefined') return
    try {
        // Usar o store do Zustand para limpar
        useAuthStore.getState().clearAuth()
    } catch {
        // Ignorar erros ao limpar
    }
}

// Função para fazer refresh do token
async function refreshToken(): Promise<string | null> {
    // Se já está fazendo refresh, retornar a promise existente
    if (isRefreshing && refreshPromise) {
        return refreshPromise
    }

    isRefreshing = true
    refreshPromise = (async () => {
        try {
            const storeId = process.env.NEXT_PUBLIC_STORE_ID
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }

            if (storeId) {
                headers['x-store-id'] = storeId
            }

            const response = await fetch(`${API_URL}/customers/refresh`, {
                method: 'POST',
                headers,
                credentials: 'include', // Importante para enviar cookies
            })

            if (!response.ok) {
                // Refresh falhou, limpar autenticação
                clearAuth()
                return null
            }

            const data = await response.json()
            const { accessToken, customer } = data

            if (accessToken) {
                // Atualizar token no store
                updateAccessToken(accessToken, customer)
                return accessToken
            }

            return null
        } catch (error) {
            // Erro ao fazer refresh, limpar autenticação
            clearAuth()
            return null
        } finally {
            isRefreshing = false
            refreshPromise = null
        }
    })()

    return refreshPromise
}

export async function fetchAPI(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    }

    // Buscar storeId apenas de variável de ambiente (não usa localStorage)
    // No Next.js, variáveis NEXT_PUBLIC_* são expostas no cliente no build time
    const storeId = process.env.NEXT_PUBLIC_STORE_ID

    if (typeof window !== 'undefined' && !storeId) {
        console.warn('[API] NEXT_PUBLIC_STORE_ID não está definido. Verifique o arquivo .env da aplicação web.')
    }

    if (storeId) {
        headers['x-store-id'] = storeId
    }

    // Adicionar token de autenticação se disponível
    const accessToken = getAccessToken()
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
    }

    // Criar AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    try {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
            credentials: 'include', // Importante para enviar cookies (refreshToken)
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            // Se for 401 (token inválido/expirado), tentar refresh
            if (response.status === 401 && path !== '/customers/refresh' && path !== '/customers/login') {
                const newToken = await refreshToken()

                if (newToken) {
                    // Token atualizado, tentar requisição original novamente
                    headers['Authorization'] = `Bearer ${newToken}`

                    const retryResponse = await fetch(`${API_URL}${path}`, {
                        ...options,
                        headers,
                        signal: controller.signal,
                        credentials: 'include',
                    })

                    clearTimeout(timeoutId)

                    if (!retryResponse.ok) {
                        // Tentar ler mensagem de erro da resposta
                        let errorMessage = retryResponse.statusText
                        let errorDetails: any = null
                        try {
                            const errorData = await retryResponse.json()
                            errorMessage = errorData.error || errorData.message || retryResponse.statusText
                            errorDetails = errorData.details || null
                        } catch {
                            // Se não conseguir parsear JSON, usa statusText
                        }

                        const error = new Error(`API Error: ${errorMessage}`) as Error & {
                            status: number
                            payload?: { error?: string; details?: any }
                        }
                        error.status = retryResponse.status
                        error.payload = { error: errorMessage, details: errorDetails }
                        throw error
                    }

                    // Retornar resposta da retry
                    const contentType = retryResponse.headers.get('content-type')
                    const contentLength = retryResponse.headers.get('content-length')

                    if (retryResponse.status === 204 || contentLength === '0') {
                        return null
                    }

                    const text = await retryResponse.text()
                    if (!text || text.trim().length === 0) {
                        return null
                    }

                    try {
                        return JSON.parse(text)
                    } catch (parseError) {
                        return text
                    }
                } else {
                    // Refresh falhou, limpar autenticação e lançar erro
                    clearAuth()
                }
            }

            // Tentar ler mensagem de erro da resposta
            let errorMessage = response.statusText
            let errorDetails: any = null
            try {
                const errorData = await response.json()
                errorMessage = errorData.error || errorData.message || response.statusText
                errorDetails = errorData.details || null
            } catch {
                // Se não conseguir parsear JSON, usa statusText
            }

            const error = new Error(`API Error: ${errorMessage}`) as Error & {
                status: number
                payload?: { error?: string; details?: any }
            }
            error.status = response.status
            error.payload = { error: errorMessage, details: errorDetails }
            throw error
        }

        // Verificar se a resposta está vazia (204 No Content) ou não tem conteúdo
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')

        // Se for 204 No Content ou não houver conteúdo, retornar null
        if (response.status === 204 || contentLength === '0') {
            return null
        }

        // Verificar se há conteúdo antes de tentar parsear JSON
        const text = await response.text()
        if (!text || text.trim().length === 0) {
            return null
        }

        try {
            return JSON.parse(text)
        } catch (parseError) {
            // Se não conseguir parsear, retornar o texto como está (pode ser uma string)
            return text
        }
    } catch (error) {
        clearTimeout(timeoutId)

        // Tratar erro de abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
            const timeoutError = new Error('Request timeout: A requisição demorou mais de 30 segundos') as Error & {
                status: number
                payload?: { error?: string }
            }
            timeoutError.status = 408
            timeoutError.payload = { error: 'Request timeout' }
            throw timeoutError
        }

        // Tratar erro de rede
        if (error instanceof TypeError && error.message.includes('fetch')) {
            const networkError = new Error('Erro de rede: Não foi possível conectar ao servidor') as Error & {
                status: number
                payload?: { error?: string }
            }
            networkError.status = 0
            networkError.payload = { error: 'Network error' }
            throw networkError
        }

        // Re-lançar outros erros
        throw error
    }
}
