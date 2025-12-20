import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { compressJson, exceedsSizeLimit } from './utils/compression'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Instância base do axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Importante para cookies HttpOnly
})

// Interceptor para comprimir payloads grandes automaticamente
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Apenas comprimir requisições POST/PUT/PATCH com body
    if (
      config.data &&
      (config.method === 'post' || config.method === 'put' || config.method === 'patch') &&
      typeof config.data === 'object' &&
      !(config.data instanceof Blob) &&
      !(config.data instanceof ArrayBuffer) &&
      !(config.data instanceof FormData)
    ) {
      // Verificar se o payload excede 500KB
      if (exceedsSizeLimit(config.data, 500 * 1024)) {
        try {
          // Comprimir o payload
          const compressed = compressJson(config.data)
          
          // Converter ArrayBuffer para Blob para enviar como binary
          const blob = new Blob([compressed], { type: 'application/gzip' })
          
          // Atualizar config para enviar o blob comprimido
          config.data = blob
          config.headers = config.headers || {}
          config.headers['Content-Type'] = 'application/gzip'
          config.headers['Content-Encoding'] = 'gzip'
          
          // Configurar para não transformar o Blob (enviar como binary)
          config.transformRequest = []
        } catch (error) {
          console.error('[apiClient] Erro ao comprimir payload:', error)
          // Em caso de erro, continuar sem compressão
        }
      }
    }

    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

// Interceptor para adicionar token (storeId vem do JWT, não precisa enviar no header)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obter token do localStorage (será gerenciado pelo auth-store)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')

      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

// Interceptor para refresh token automático
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ error?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Se for 401 e não for a rota de refresh/login, tentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já está fazendo refresh, adicionar à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Tentar refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const { accessToken } = response.data

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }

        processQueue(null, accessToken)

        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null)

        // Se refresh falhar, limpar sessão e redirecionar para login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

