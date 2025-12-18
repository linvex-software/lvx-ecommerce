'use client'

/**
 * Página inicial - Renderiza o template fixo
 * 
 * Sistema baseado em templates fixos com micro-configurações
 * Não usa mais Craft.js ou edição de componentes
 */

import { FlorDeMeninaTemplate } from '@/components/template/flor-de-menina-template'

export default function HomePage() {
  // Renderiza o template fixo
  // O template é carregado via TemplateProvider no layout
  return <FlorDeMeninaTemplate />
}
