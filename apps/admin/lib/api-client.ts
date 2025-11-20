import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Instância base do axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Importante para cookies HttpOnly
})

// Interceptor para adicionar token e store-id
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obter token do localStorage (será gerenciado pelo auth-store)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      const storeId = localStorage.getItem('storeId')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      if (storeId) {
        config.headers['x-store-id'] = storeId
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
          localStorage.removeItem('storeId')
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

