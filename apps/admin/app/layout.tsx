import type { ReactNode } from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}

