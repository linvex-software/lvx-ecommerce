const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export async function fetchAPI(path: string, options: RequestInit = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    // Se houver um store ID configurado, envia no header

    let storeId = process.env.NEXT_PUBLIC_STORE_ID

    if (!storeId && typeof window !== 'undefined') {
        storeId = localStorage.getItem('storeId') || undefined
    }

    if (storeId) {
        (headers as Record<string, string>)['x-store-id'] = storeId
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
