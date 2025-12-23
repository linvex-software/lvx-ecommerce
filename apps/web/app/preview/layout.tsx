import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preview - Editor',
  description: 'Preview isolado do template',
  robots: 'noindex, nofollow',
}

/**
 * Layout mínimo para a rota de preview
 * Não carrega CSS do admin, apenas CSS do template será carregado dinamicamente
 */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}








