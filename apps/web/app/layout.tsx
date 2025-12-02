import type { ReactNode } from 'react'
import './globals.css'

import Providers from '@/components/providers'
import { CartSyncProvider } from '@/components/CartSyncProvider'
import { Toaster } from 'react-hot-toast'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <CartSyncProvider>
            {children}
            <Toaster position="top-center" reverseOrder={false} />
          </CartSyncProvider>
        </Providers>
      </body>
    </html>
  )
}

