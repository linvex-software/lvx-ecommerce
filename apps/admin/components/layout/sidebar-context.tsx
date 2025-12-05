'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Inicializar com false para garantir que server e client renderizem igual
  // O valor correto será carregado no useEffect no client-side após hidratação
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  // Carregar preferência do localStorage após montagem do componente (client-side apenas)
  useEffect(() => {
    setHasMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // Expor hasMounted para componentes filhos se necessário (para evitar hydration issues)
  const value = {
    isCollapsed: hasMounted ? isCollapsed : false,
    toggleSidebar: () => {
      setIsCollapsed((prev) => {
        const newValue = !prev
        localStorage.setItem('sidebar-collapsed', String(newValue))
        return newValue
      })
    }
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

