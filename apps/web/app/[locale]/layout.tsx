import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

import Providers from '@/components/providers'
import { CartSyncProvider } from '@/components/CartSyncProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { TemplateProvider } from '@/components/template-provider-wrapper'
import { Toaster } from 'react-hot-toast'

// Por enquanto, usar template padrão
// Em produção, isso virá do banco de dados baseado na loja
const DEFAULT_TEMPLATE_ID = 'flor-de-menina'

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

