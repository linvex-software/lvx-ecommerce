import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Customer {
  id: string
  store_id: string
  name: string
  email: string | null
  cpf: string
  phone: string | null
  created_at: string
}

interface AuthState {
  accessToken: string | null
  customer: Customer | null
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setAuth: (accessToken: string, customer: Customer) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      customer: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        })
      },
      setAuth: (accessToken, customer) => {
        set({
          accessToken,
          customer,
          _hasHydrated: true,
        })
      },
      clearAuth: () => {
        set({
          accessToken: null,
          customer: null,
          _hasHydrated: true, // Manter como true mesmo após logout
        })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state) {
            // Marcar como hidratado após restaurar do localStorage
            state._hasHydrated = true
          } else {
            // Em caso de erro ou estado vazio, também marcar como hidratado
            // para não bloquear a aplicação
            if (state) {
              state._hasHydrated = true
            }
          }
        }
      },
    }
  )
)

// Hook auxiliar para obter isAuthenticated calculado
export function useIsAuthenticated() {
  const { accessToken, customer } = useAuthStore()
  return !!(accessToken && customer)
}

// Hook auxiliar para verificar se já hidratou
export function useHasHydrated() {
  return useAuthStore((state) => state._hasHydrated)
}

