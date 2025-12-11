import type { ReactNode } from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

