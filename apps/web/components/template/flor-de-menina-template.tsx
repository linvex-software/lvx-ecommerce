'use client'

/**
 * Template: Flor de Menina
 * 
 * Renderiza o template usando o mesmo layout.json que o editor usa,
 * garantindo sincronização perfeita entre web e editor.
 */

import dynamic from 'next/dynamic'
import { CartProvider } from './flor-de-menina/components/contexts/CartContext'
import { TemplateLayoutRenderer } from '@/lib/templates/template-layout-renderer'
import { ErrorBoundary } from '@/components/error-boundary'

// Lazy load de componentes não críticos para melhorar FCP
// Esses componentes não precisam estar no carregamento inicial
const MiniCart = dynamic(
  () => import('./flor-de-menina/components/cart/MiniCart').then((mod) => ({ default: mod.MiniCart })),
  {
    ssr: false,
  }
)

const ScrollToTopButton = dynamic(
  () => import('./flor-de-menina/components/layout/ScrollToTopButton').then((mod) => ({ default: mod.ScrollToTopButton })),
  {
    ssr: false,
  }
)

export function FlorDeMeninaTemplate() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <TemplateLayoutRenderer templateId="flor-de-menina" />
          <MiniCart />
          <ScrollToTopButton />
        </div>
      </CartProvider>
    </ErrorBoundary>
  )
}

