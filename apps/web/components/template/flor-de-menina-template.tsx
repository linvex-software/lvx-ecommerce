'use client'

/**
 * Template: Flor de Menina
 * 
 * Renderiza o template usando o mesmo layout.json que o editor usa,
 * garantindo sincronização perfeita entre web e editor.
 */

import { CartProvider } from './flor-de-menina/components/contexts/CartContext'
import { MiniCart } from './flor-de-menina/components/cart/MiniCart'
import { WhatsAppButton } from './flor-de-menina/components/layout/WhatsAppButton'
import { TemplateLayoutRenderer } from '@/lib/templates/template-layout-renderer'

export function FlorDeMeninaTemplate() {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <TemplateLayoutRenderer templateId="flor-de-menina" />
        <MiniCart />
        <WhatsAppButton />
      </div>
    </CartProvider>
  )
}

