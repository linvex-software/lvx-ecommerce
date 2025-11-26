'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'

export function Header() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Ignorar erros no logout
    } finally {
      clearSession()
      router.push('/login')
    }
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name[0].toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/95 backdrop-blur-sm px-10">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
          {getUserInitials()}
        </div>
        
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs font-light text-gray-500">{user?.email}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200/80 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </header>
  )
}

