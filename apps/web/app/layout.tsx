import type { ReactNode } from 'react'
import './globals.css'

import Providers from '@/components/providers'
import { CartSyncProvider } from '@/components/CartSyncProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'react-hot-toast'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <ThemeProvider>
            <CartSyncProvider>
              {children}
              <Toaster position="top-center" reverseOrder={false} />
            </CartSyncProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}

