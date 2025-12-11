'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Carregar tema do localStorage na montagem
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('admin-theme') as Theme | null
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored)
    } else {
      // Default: light mode
      setThemeState('light')
    }
  }, [])

  // Aplicar tema no DOM
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Remover todas as classes de tema
    root.classList.remove('light', 'dark')

    // Aplicar tema atual
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }

    // Salvar no localStorage
    localStorage.setItem('admin-theme', theme)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Evitar flash de conteúdo não estilizado
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
