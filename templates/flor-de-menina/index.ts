/**
 * Template: Flor de Menina
 * 
 * Registro dos componentes do template para o Craft.js
 * 
 * IMPORTANTE: Este arquivo importa componentes de apps/web.
 * Os componentes já têm 'use client' declarado para funcionar no cliente.
 */

// Importações estáticas - os componentes têm 'use client' então são processados corretamente
import { Header } from '../../apps/web/components/template/flor-de-menina/components/layout/Header'
import { Footer } from '../../apps/web/components/template/flor-de-menina/components/layout/Footer'
import { HeroBanner } from '../../apps/web/components/template/flor-de-menina/components/home/HeroBanner'
import { ProductShowcase } from '../../apps/web/components/template/flor-de-menina/components/home/ProductShowcase'
import { CategoryBanner } from '../../apps/web/components/template/flor-de-menina/components/home/CategoryBanner'
import { PromoBanner } from '../../apps/web/components/template/flor-de-menina/components/home/PromoBanner'
import { InstagramFeed } from '../../apps/web/components/template/flor-de-menina/components/home/InstagramFeed'
import { EditableText } from '../../apps/web/components/template/flor-de-menina/components/common/editable-text'
import { EditableButton } from '../../apps/web/components/template/flor-de-menina/components/common/editable-button'

// Componentes do admin/store para páginas dinâmicas
import { FAQ } from '../../apps/admin/components/store/faq'
import { TextBlockCraft } from '../../apps/admin/components/editor/craft-blocks/TextBlockCraft'

export const templateId = 'flor-de-menina'
export const templateName = 'Flor de Menina'
export const templateDescription = 'Template elegante para lojas de moda feminina'

/**
 * Resolver de componentes para o Craft.js
 * Contém todos os componentes que podem ser usados neste template
 */
export const componentResolver = {
  Header,
  Footer,
  HeroBanner,
  ProductShowcase,
  CategoryBanner,
  PromoBanner,
  InstagramFeed,
  EditableText,
  EditableButton,
  // Componentes para páginas dinâmicas
  FAQ,
  TextBlock: TextBlockCraft,
}

// Exportar componentes individualmente também
export { Header, Footer, HeroBanner, ProductShowcase, CategoryBanner, PromoBanner, InstagramFeed, EditableText, EditableButton, FAQ, TextBlockCraft }

/**
 * Carrega o layout fixo do template
 */
export async function loadTemplateLayout(): Promise<Record<string, unknown>> {
  // Em produção, isso pode carregar de uma API
  // Por enquanto, retorna o layout.json local
  const layout = await import('./layout.json')
  return layout.default as Record<string, unknown>
}

/**
 * Carrega a configuração do template
 */
export async function loadTemplateConfig() {
  const config = await import('./template.config.json')
  return config.default
}
