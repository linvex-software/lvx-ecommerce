const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const error = new Error(`API Error: ${response.statusText}`) as Error & { status: number }
        error.status = response.status
        throw error
    }

    return response.json()
}
