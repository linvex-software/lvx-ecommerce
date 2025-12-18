import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@white-label/types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  activeStoreId: string | null
  setSession: (user: AuthUser, token: string | null, storeId?: string) => void
  clearSession: () => void
  isAuthenticated: () => boolean
  needsOnboarding: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      activeStoreId: null,

      setSession: (user: AuthUser, token: string | null, storeId?: string) => {
        const selectedStoreId = storeId || user.storeId || null
        
        set({ user, accessToken: token, activeStoreId: selectedStoreId })
        
        // Sincronizar apenas token e user no localStorage (storeId vem do JWT)
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('accessToken', token)
          } else {
            localStorage.removeItem('accessToken')
          }
          
          localStorage.setItem('user', JSON.stringify(user))
        }
      },

      clearSession: () => {
        set({ user: null, accessToken: null, activeStoreId: null })
        // Limpar localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
        }
      },

      isAuthenticated: () => {
        const state = get()
        // Para o PDV, não exigir activeStoreId (vendedor pode não ter loja própria)
        return !!(state.user && state.accessToken)
      },

      needsOnboarding: () => {
        const state = get()
        if (!state.user) return false
        return !state.user.storeId && !state.user.store
      }
    }),
    {
      name: 'pdv-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        activeStoreId: state.activeStoreId
      })
    }
  )
)

