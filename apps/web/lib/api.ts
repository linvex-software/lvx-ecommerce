const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
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
