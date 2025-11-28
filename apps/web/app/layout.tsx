import type { ReactNode } from 'react'
import './globals.css'

import Providers from '@/components/providers'
import { CartSyncProvider } from '@/components/CartSyncProvider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <CartSyncProvider>
            {children}
          </CartSyncProvider>
        </Providers>
      </body>
    </html>
  )
}

