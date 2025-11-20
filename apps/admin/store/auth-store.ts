import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@white-label/types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  storeId: string | null
  setSession: (user: AuthUser, token: string, storeId: string) => void
  clearSession: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      storeId: null,

      setSession: (user: AuthUser, token: string, storeId: string) => {
        set({ user, accessToken: token, storeId })
        // Sincronizar com localStorage para o api-client
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', token)
          localStorage.setItem('storeId', storeId)
          localStorage.setItem('user', JSON.stringify(user))
        }
      },

      clearSession: () => {
        set({ user: null, accessToken: null, storeId: null })
        // Limpar localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('storeId')
          localStorage.removeItem('user')
        }
      },

      isAuthenticated: () => {
        const state = get()
        return !!(state.user && state.accessToken && state.storeId)
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        storeId: state.storeId
      })
    }
  )
)

