'use client'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { usePathname } from 'next/navigation'

export default function MinhaContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Se não for a rota raiz, não renderiza este layout (deixa os sub-layouts cuidarem)
  const isRootPath = pathname === '/minha-conta'
  
  if (!isRootPath) {
    // Para sub-páginas, renderizar apenas o RequireAuth
    // O layout com sidebar será aplicado pelas sub-páginas
    return <RequireAuth>{children}</RequireAuth>
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
