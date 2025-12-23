import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './globals.css'

import Providers from '@/components/providers'
import { CartSyncProvider } from '@/components/CartSyncProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { TemplateProvider } from '@/components/template-provider-wrapper'
import { Toaster } from 'react-hot-toast'
import { GlobalErrorHandler } from '@/components/global-error-handler'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Por enquanto, usar template padrão
// Em produção, isso virá do banco de dados baseado na loja
const DEFAULT_TEMPLATE_ID = 'flor-de-menina'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tvx-ecommerce-web.vercel.app'),
  title: {
    default: 'Loja Online',
    template: '%s | Loja Online',
  },
  description: 'Sua loja online',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preconnect para recursos externos - melhora performance de fontes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload de recursos críticos do template */}
        <link
          rel="preload"
          href={`/templates/${DEFAULT_TEMPLATE_ID}/styles.css`}
          as="style"
        />
        
        {/* Fontes Google otimizadas - carregamento não-bloqueante */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <GlobalErrorHandler />
        <Providers>
          {/* TemplateProvider primeiro para aplicar estilos do template antes de outros providers */}
          <TemplateProvider templateId={DEFAULT_TEMPLATE_ID}>
            <ThemeProvider>
              <CartSyncProvider>
                {children}
                <Toaster position="top-center" reverseOrder={false} />
                <SpeedInsights />
              </CartSyncProvider>
            </ThemeProvider>
          </TemplateProvider>
        </Providers>
      </body>
    </html>
  )
}

