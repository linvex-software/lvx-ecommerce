'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Moon, Sun, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import { useSidebar } from './sidebar-context'

export function Header() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const { theme, toggleTheme } = useTheme()
  const { setIsMobileOpen } = useSidebar()

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 sm:px-6 dark:bg-background/95">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Botão menu mobile */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden h-9 w-9"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-label font-semibold uppercase tracking-wide text-white shadow-sm flex-shrink-0">
          {getUserInitials()}
        </div>

        <div className="text-left min-w-0 hidden sm:block">
          <p className="text-body font-semibold text-text-primary truncate">{user?.name}</p>
          <p className="text-small font-normal text-text-secondary truncate">{user?.email}</p>
        </div>
        <div className="text-left sm:hidden">
          <p className="text-sm font-semibold text-text-primary truncate max-w-[120px]">{user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-200" />
          )}
        </Button>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="gap-2 hidden sm:flex"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="icon"
          className="sm:hidden h-9 w-9"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
