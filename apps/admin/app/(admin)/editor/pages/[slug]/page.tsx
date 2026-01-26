'use client'

// Forçar renderização dinâmica para evitar pré-renderização estática
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Editor, useEditor, Frame } from '@craftjs/core'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { EditorTopbar } from '@/components/editor/editor-topbar'
import { PreviewProvider } from '@/components/editor/preview-context'
import { PageSettingsPanel } from '@/components/editor/pages/page-settings-panel'
import { EditorSettingsPanel } from '@/components/editor/editor-settings-panel'
import { TemplateSelector } from '@/components/editor/template-selector'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { loadTemplateLayout, loadTemplateConfig, loadTemplateComponents } from '@/lib/templates/template-loader'
import { validateAndCleanLayout } from '@/lib/templates/layout-validator'
import { RestrictedFrame } from '@/components/editor/restricted-frame'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { EditorCartProvider } from '@/components/editor/editor-cart-provider'
// Componente de preview que replica o layout da loja
// Replica o mesmo layout e estrutura do DynamicPageRenderer da loja

interface Product {
  id: string
  name: string
  slug: string
  base_price: string
  sku: string
  status: string
  main_image?: string | null
}

interface DynamicPage {
  id: string
  title: string
  slug: string
  published: boolean
  contentJson?: Record<string, unknown> | null
  products?: Array<{
    id: string
    productId: string
    orderIndex: number
    product?: Product
  }>
}

// Componente de preview que replica o layout da loja
function DynamicPagePreview({ page }: { page: DynamicPage }) {
  // Mapear produtos para o formato esperado pelo ProductCard
  const products = useMemo(() => {
    if (!page.products) return []
    
    return page.products
      .filter(p => p.product !== undefined)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(p => {
        const product = p.product!
        // Usar mainImage ou main_image (pode vir de diferentes formatos)
        const mainImage = (product as any).mainImage || (product as any).main_image || null
        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: parseFloat(product.base_price || '0'),
          images: mainImage ? [mainImage] : [],
          category: (product as any).category_name || 'Geral',
          sizes: (product as any).sizes || [],
          colors: ((product as any).colors || []).map((c: any) => ({
            name: c.name,
            hex: c.hex || '#000000',
          })),
          description: (product as any).description || '',
          isNew: false,
          isBestSeller: false,
          isFeatured: false,
        }
      })
  }, [page.products])

  const totalResults = products.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header - mesmo estilo da página /produtos */}
      <div className="bg-cream py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl lg:text-5xl text-foreground mt-4">
            {page.title || 'Nova Página'}
          </h1>
          {totalResults > 0 && (
            <p className="text-muted-foreground font-body mt-2">
              {totalResults} produto{totalResults !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid - mesmo estilo da página /produtos */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body mb-4">
              Nenhum produto encontrado nesta página.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Imagem do produto */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Sem imagem
                    </div>
                  )}
                </div>
                
                {/* Informações do produto */}
                <div className="p-4">
                  <h3 className="font-body text-sm font-medium text-foreground mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="font-body text-lg font-semibold text-primary">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </p>
                  {product.category && (
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {product.category}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PageEditorContent() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const isNew = slug === 'new'
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState<DynamicPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [templateResolver, setTemplateResolver] = useState<Record<string, any>>({})
  const [selectedTemplate] = useState<string>('flor-de-menina')
  const editorQueryRef = useRef<any>(null)

  // Carregar página ou criar nova
  useEffect(() => {
    const loadPage = async () => {
      if (!user?.storeId) return

      try {
        setIsLoading(true)

        if (isNew) {
          // Nova página - criar estrutura básica
          setPage({
            id: '',
            title: '',
            slug: '',
            published: false,
            contentJson: null,
            products: []
          })
        } else {
          // Carregar página existente
          const response = await apiClient.get<{ page: DynamicPage }>(`/admin/dynamic-pages/${slug}`)
          setPage(response.data.page)
        }

        // Carregar componentes do template PRIMEIRO (antes de deserializar)
        const resolver = await loadTemplateComponents(selectedTemplate)
        setTemplateResolver(resolver)
      } catch (error: any) {
        if (error?.response?.status === 404 && !isNew) {
          toast.error('Página não encontrada')
          router.push('/editor/pages')
        } else {
          console.error('Erro ao carregar página:', error)
          toast.error('Erro ao carregar página')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isNew, user?.storeId])

  // Componente interno que usa useEditor (deve estar dentro do Editor)
  function PageEditorInner() {
    const { actions, query } = useEditor()
    
    // Armazenar query na ref para uso externo
    useEffect(() => {
      editorQueryRef.current = query
    }, [query])
    
    // Deserializar conteúdo DEPOIS que o resolver estiver pronto
    useEffect(() => {
      if (!page || !templateResolver || Object.keys(templateResolver).length === 0) {
        return
      }
      if (isNew) return
      if (!page.contentJson || Object.keys(page.contentJson).length === 0) return

      // Verificar se os componentes necessários estão no resolver E são válidos
      const requiredComponents = ['FAQ', 'TextBlock', 'div']
      const missingComponents: string[] = []
      const invalidComponents: string[] = []
      
      for (const comp of requiredComponents) {
        if (!templateResolver[comp]) {
          missingComponents.push(comp)
        } else {
          // Verificar se o componente é válido (função ou objeto com propriedades React)
          const compValue = templateResolver[comp]
          const compType = typeof compValue
          if (compType !== 'function' && compType !== 'object') {
            invalidComponents.push(`${comp} (tipo: ${compType})`)
          } else if (compType === 'object' && !compValue.$$typeof && !compValue.render) {
            // Objeto que não parece ser um componente React válido
            invalidComponents.push(`${comp} (objeto inválido)`)
          }
        }
      }
      
      if (missingComponents.length > 0) {
        console.warn('[PageEditor] Componentes faltando no resolver:', missingComponents)
        console.log('[PageEditor] Resolver atual:', Object.keys(templateResolver))
        // Não deserializar se componentes essenciais estão faltando
        return
      }
      
      if (invalidComponents.length > 0) {
        console.error('[PageEditor] Componentes inválidos no resolver:', invalidComponents)
        console.error('[PageEditor] Detalhes:', invalidComponents.map(comp => {
          const compName = comp.split(' ')[0]
          return `${compName}: ${JSON.stringify(templateResolver[compName], null, 2).substring(0, 200)}`
        }))
        // Não deserializar se componentes são inválidos
        return
      }

      // Validar e limpar o layout antes de deserializar
      let contentData: string
      try {
        const rawContent = typeof page.contentJson === 'string'
          ? page.contentJson
          : JSON.stringify(page.contentJson)
        
        // Parsear o JSON
        const parsed = JSON.parse(rawContent)
        
        // Validar estrutura básica
        if (!parsed || typeof parsed !== 'object' || !parsed.ROOT) {
          console.warn('[PageEditor] JSON do Craft.js inválido: falta ROOT ou estrutura incorreta')
          return
        }
        
        // Validar e limpar o layout usando a função do projeto
        const cleanedLayout = validateAndCleanLayout(parsed, templateResolver)
        
        // Verificar se a limpeza removeu muitos nós (indicando componentes inválidos)
        const originalNodeCount = Object.keys(parsed).length
        const cleanedNodeCount = Object.keys(cleanedLayout).length
        const removedPercentage = originalNodeCount > 0 
          ? ((originalNodeCount - cleanedNodeCount) / originalNodeCount) * 100 
          : 0
        
        if (removedPercentage > 50) {
          console.warn(`[PageEditor] Muitos nós removidos (${removedPercentage.toFixed(1)}%), pode indicar componentes inválidos`)
          console.warn('[PageEditor] Tentando deserializar layout original mesmo assim...')
          contentData = rawContent
        } else {
          // Usar layout limpo
          contentData = JSON.stringify(cleanedLayout)
          console.log('[PageEditor] Layout validado e limpo com sucesso')
        }
      } catch (error) {
        console.error('[PageEditor] Erro ao validar JSON do Craft.js:', error)
        return
      }
      
      // Aguardar um tick para garantir que o resolver está aplicado no Editor
      // Verificar se o query tem acesso ao resolver correto
      const timeoutId = setTimeout(() => {
        try {
          // Verificar se o resolver realmente tem os componentes necessários
          const resolverKeys = Object.keys(templateResolver)
          console.log('[PageEditor] Tentando deserializar com resolver contendo', resolverKeys.length, 'componentes')
          
          // Verificar o resolver do Editor (pode ser diferente do templateResolver)
          const editorResolver = query.getOptions().resolver as Record<string, any>
          const editorResolverKeys = Object.keys(editorResolver || {})
          console.log('[PageEditor] Resolver do Editor contém', editorResolverKeys.length, 'componentes')
          
          // Verificar se TextBlock e FAQ estão no resolver do Editor
          if (!editorResolver.TextBlock) {
            console.error('[PageEditor] TextBlock NÃO encontrado no resolver do Editor!')
            console.error('[PageEditor] Componentes no resolver do Editor:', editorResolverKeys)
            toast.error('Erro: TextBlock não encontrado no resolver. Recarregue a página.')
            return
          }
          
          if (!editorResolver.FAQ) {
            console.error('[PageEditor] FAQ NÃO encontrado no resolver do Editor!')
            console.error('[PageEditor] Componentes no resolver do Editor:', editorResolverKeys)
            toast.error('Erro: FAQ não encontrado no resolver. Recarregue a página.')
            return
          }
          
          // Verificar se são componentes válidos
          const textBlockType = typeof editorResolver.TextBlock
          const faqType = typeof editorResolver.FAQ
          console.log('[PageEditor] TextBlock tipo:', textBlockType, 'FAQ tipo:', faqType)
          
          if (textBlockType !== 'function' && textBlockType !== 'object') {
            console.error('[PageEditor] TextBlock no resolver do Editor não é válido! Tipo:', textBlockType)
            toast.error('Erro: TextBlock inválido no resolver. Recarregue a página.')
            return
          }
          
          if (faqType !== 'function' && faqType !== 'object') {
            console.error('[PageEditor] FAQ no resolver do Editor não é válido! Tipo:', faqType)
            toast.error('Erro: FAQ inválido no resolver. Recarregue a página.')
            return
          }
          
          console.log('[PageEditor] Todos os componentes validados, deserializando...')
          actions.deserialize(contentData)
          console.log('[PageEditor] Conteúdo deserializado com sucesso')
        } catch (deserializeError: any) {
          console.error('[PageEditor] Erro ao deserializar conteúdo:', deserializeError)
          console.error('[PageEditor] Mensagem:', deserializeError?.message)
          console.error('[PageEditor] Stack:', deserializeError?.stack)
          console.error('[PageEditor] Resolver disponível:', Object.keys(templateResolver))
          console.error('[PageEditor] JSON tentado (primeiros 500 chars):', contentData.substring(0, 500))
          
          // Tentar identificar qual componente está causando o problema
          try {
            const parsed = JSON.parse(contentData)
            const componentTypes = new Set<string>()
            const collectTypes = (nodeId: string, node: any, visited = new Set()) => {
              if (!node || visited.has(nodeId)) return
              visited.add(nodeId)
              if (node.type?.resolvedName) {
                componentTypes.add(node.type.resolvedName)
              }
              if (node.nodes) {
                for (const childId of node.nodes) {
                  collectTypes(childId, parsed[childId], visited)
                }
              }
            }
            collectTypes('ROOT', parsed.ROOT)
            console.error('[PageEditor] Componentes no JSON:', Array.from(componentTypes))
            console.error('[PageEditor] Componentes no resolver:', Object.keys(templateResolver))
            const missing = Array.from(componentTypes).filter(t => !templateResolver[t] && !['div', 'span', 'p'].includes(t))
            if (missing.length > 0) {
              console.error('[PageEditor] Componentes faltando no resolver:', missing)
            }
          } catch (e) {
            // Ignorar erro de parsing
          }
          
          toast.error('Erro ao carregar conteúdo. A página pode estar vazia ou ter componentes inválidos.')
        }
      }, 500) // Aumentar delay para garantir que o resolver está aplicado

      return () => clearTimeout(timeoutId)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page?.id, templateResolver, isNew, actions])
    
    return null // Este componente só existe para usar useEditor
  }

  // Salvar página
  const handleSave = useCallback(async () => {
    if (!user?.storeId || !page) return

    try {
      setIsSaving(true)

      // Serializar conteúdo Craft.js usando o query da ref
      let serializedContent = ''
      if (editorQueryRef.current) {
        try {
          serializedContent = editorQueryRef.current.serialize()
        } catch (error) {
          console.error('Erro ao serializar conteúdo:', error)
          // Fallback: usar contentJson atual se existir
          if (page.contentJson) {
            serializedContent = typeof page.contentJson === 'string' 
              ? page.contentJson 
              : JSON.stringify(page.contentJson)
          }
        }
      } else {
        // Se não temos query ainda, usar contentJson atual
        if (page.contentJson) {
          serializedContent = typeof page.contentJson === 'string' 
            ? page.contentJson 
            : JSON.stringify(page.contentJson)
        }
      }
      
      // Converter string para objeto JSON para armazenar no banco
      const contentJson = serializedContent ? JSON.parse(serializedContent) : null

      const pageData = {
        title: page.title,
        slug: page.slug,
        published: page.published,
        contentJson
      }

      if (isNew) {
        // Criar nova página
        const response = await apiClient.post<{ page: DynamicPage }>('/admin/dynamic-pages', pageData)
        const newPage = response.data.page

        // Se houver produtos selecionados, associá-los
        if (page.products && page.products.length > 0) {
          await apiClient.put(`/admin/dynamic-pages/${newPage.id}/products`, {
            productIds: page.products.map(p => p.productId)
          })
        }

        toast.success('Página criada com sucesso!')
        router.push(`/editor/pages/${newPage.slug}`)
      } else {
        // Atualizar página existente
        await apiClient.put(`/admin/dynamic-pages/${page.id}`, pageData)

        // Atualizar produtos se necessário
        if (page.products) {
          await apiClient.put(`/admin/dynamic-pages/${page.id}/products`, {
            productIds: page.products.map(p => p.productId)
          })
        }

        toast.success('Página salva com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao salvar página:', error)
      const errorMessage = error?.response?.data?.error || 'Erro ao salvar página'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [user?.storeId, page, isNew, router])

  const handleUpdatePage = (updatedPage: Partial<DynamicPage>) => {
    if (page) {
      setPage({ ...page, ...updatedPage })
    }
  }

  // Só renderizar o Editor quando o resolver estiver pronto
  const isResolverReady = templateResolver && Object.keys(templateResolver).length > 0

  return (
    <PreviewProvider>
      {isResolverReady ? (
        <Editor
          resolver={templateResolver}
          enabled={true}
          key={`editor-${Object.keys(templateResolver).length}`} // Force re-render quando resolver muda
        >
          <PageEditorInner />
          <div className="flex h-screen flex-col bg-surface-2">
          <EditorTopbar 
            isPreview={false}
            customActionButton={page ? {
              label: 'Salvar Página',
              onClick: handleSave,
              disabled: isSaving || !page.title?.trim() || !page.slug?.trim(),
              isLoading: isSaving
            } : undefined}
          />
        
          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Navigation + Page Settings */}
            <div className="w-80 border-r border-border bg-surface flex flex-col">
              {/* Navigation */}
              <div className="flex-shrink-0">
                <TemplateSelector />
              </div>
              
              {/* Page Settings Panel */}
              <div className="flex-1 overflow-y-auto border-t border-border">
                {isLoading || !page ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
                  </div>
                ) : (
                  <PageSettingsPanel
                    page={page}
                    onUpdate={handleUpdatePage}
                  />
                )}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-surface-2 overflow-y-auto">
              {isLoading || !page || Object.keys(templateResolver).length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
                </div>
              ) : (
                <ThemeProvider>
                  <EditorCartProvider>
                    <div className="min-h-full bg-background">
                      {/* Renderizar conteúdo Craft.js se existir */}
                      {page.contentJson && Object.keys(page.contentJson).length > 0 ? (
                        <RestrictedFrame
                          data={JSON.stringify(page.contentJson)}
                        />
                      ) : (
                        /* Preview padrão: mostrar produtos selecionados - mesmo layout da loja */
                        <DynamicPagePreview page={page} />
                      )}
                    </div>
                  </EditorCartProvider>
                </ThemeProvider>
              )}
            </div>

            {/* Right Panel - Component Settings */}
            <div className="w-80 border-l border-border bg-surface overflow-y-auto">
              <EditorSettingsPanel />
            </div>
          </div>
        </div>
        </Editor>
      ) : (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      )}
    </PreviewProvider>
  )
}

export default function PageEditorPage() {
  return <PageEditorContent />
}

