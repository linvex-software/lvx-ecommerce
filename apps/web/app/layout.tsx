import type { ReactNode } from 'react'
import './globals.css'

// Root layout - apenas estrutura HTML básica
// A lógica completa está em [locale]/layout.tsx
// O Next.js App Router requer que o layout raiz retorne apenas children
// quando há layouts aninhados
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}

