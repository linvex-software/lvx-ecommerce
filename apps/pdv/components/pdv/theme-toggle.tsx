'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@white-label/ui'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="rounded-full p-2 h-9 w-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      )}
    </Button>
  )
}

