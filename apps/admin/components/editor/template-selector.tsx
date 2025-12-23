'use client'

/**
 * Seletor de Templates
 * 
 * Permite selecionar um template e carregar seu layout fixo
 */

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout, Check, Menu, Home, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string
  thumbnail?: string
}

const availableTemplates: Template[] = [
  {
    id: 'flor-de-menina',
    name: 'Flor de Menina',
    description: 'Template elegante para lojas de moda feminina'
  }
]

interface TemplateSelectorProps {
  onTemplateSelect?: (templateId: string) => void
  selectedTemplate?: string
}

export function TemplateSelector({ onTemplateSelect, selectedTemplate: externalSelected }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(externalSelected || 'flor-de-menina')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (externalSelected) {
      setSelectedTemplate(externalSelected)
    }
  }, [externalSelected])

  const handleSelectTemplate = async (templateId: string) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      setSelectedTemplate(templateId)
      onTemplateSelect?.(templateId)
    } catch (error) {
      console.error('Erro ao selecionar template:', error)
      alert('Erro ao selecionar template. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const pathname = usePathname()
  const router = useRouter()
  const isHomepage = pathname === '/editor' || pathname === '/editor/homepage'
  const isMenu = pathname === '/editor/menu'
  const isPages = pathname?.startsWith('/editor/pages') || false

  return (
    <div className="h-full flex flex-col">
      {/* Seletor de Seções */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-text-primary mb-3">Editor</h3>
        <div className="space-y-1">
          <Link
            href="/editor"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isHomepage
                ? "bg-primary/10 text-primary font-medium"
                : "text-text-secondary hover:bg-hover"
            )}
          >
            <Home className="w-4 h-4" />
            Homepage
          </Link>
          <Link
            href="/editor/menu"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isMenu
                ? "bg-primary/10 text-primary font-medium"
                : "text-text-secondary hover:bg-hover"
            )}
          >
            <Menu className="w-4 h-4" />
            Menu / Navbar
          </Link>
          <Link
            href="/editor/pages"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isPages
                ? "bg-primary/10 text-primary font-medium"
                : "text-text-secondary hover:bg-hover"
            )}
          >
            <FileText className="w-4 h-4" />
            Páginas
          </Link>
        </div>
      </div>

      {/* Seletor de Templates (apenas na homepage) */}
      {isHomepage && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="w-5 h-5 text-text-secondary" />
            <h3 className="font-semibold text-sm text-text-primary">Template</h3>
          </div>

          <div className="space-y-2">
            {availableTemplates.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  selectedTemplate === template.id && "border-primary bg-primary/5"
                )}
                onClick={() => handleSelectTemplate(template.id)}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {isLoading && (
            <div className="mt-4 text-center text-sm text-text-secondary">
              Carregando template...
            </div>
          )}
        </div>
      )}
    </div>
  )
}




