'use client'

/**
 * Renderizador de templates
 * 
 * Carrega e renderiza o template selecionado dinamicamente
 */

import { useEffect, useState, ReactNode } from 'react'
import { useTemplate } from './template-provider'

interface TemplateRendererProps {
  children?: ReactNode
  templateId: string
}

export function TemplateRenderer({ children, templateId }: TemplateRendererProps) {
  const { config, isLoading } = useTemplate()
  const [TemplateComponent, setTemplateComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    // Em produção, isso carregaria o template dinamicamente
    // Por enquanto, vamos usar um componente wrapper que renderiza o template
    // O template real está em /templates/woman-shop-template/src (fisicamente em /templates/flor-de-menina/)
    
    // Por enquanto, apenas renderiza os children
    // O template será integrado posteriormente
    setTemplateComponent(() => () => <>{children}</>)
  }, [templateId, children])

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Carregando loja...</div>
      </div>
    )
  }

  if (!TemplateComponent) {
    return <>{children}</>
  }

  return <TemplateComponent />
}





