import type { ReactNode } from 'react'
import './globals.css'

import Providers from '@/components/providers'
import { CartSyncProvider } from '@/components/CartSyncProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { TemplateProvider } from '@/components/template-provider-wrapper'
import { Toaster } from 'react-hot-toast'

// Por enquanto, usar template padrão
// Em produção, isso virá do banco de dados baseado na loja
const DEFAULT_TEMPLATE_ID = 'flor-de-menina'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {/* TemplateProvider primeiro para aplicar estilos do template antes de outros providers */}
          <TemplateProvider templateId={DEFAULT_TEMPLATE_ID}>
            <ThemeProvider>
              <CartSyncProvider>
                {children}
                <Toaster position="top-center" reverseOrder={false} />
              </CartSyncProvider>
            </ThemeProvider>
          </TemplateProvider>
        </Providers>
      </body>
    </html>
  )
}

