'use client'

// Forçar renderização dinâmica para evitar pré-renderização estática
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Editor, useEditor, Frame } from '@craftjs/core'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { EditorTopbar } from '@/components/editor/editor-topbar'
import { PreviewProvider } from '@/components/editor/preview-context'
import { PageSettingsPanel } from '@/components/editor/pages/page-settings-panel'
import { TemplateSelector } from '@/components/editor/template-selector'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { loadTemplateLayout, loadTemplateConfig, loadTemplateComponents } from '@/lib/templates/template-loader'
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
  const { actions, query } = useEditor()
  const [page, setPage] = useState<DynamicPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [templateResolver, setTemplateResolver] = useState<Record<string, any>>({})
  const [selectedTemplate] = useState<string>('flor-de-menina')

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

          // Carregar conteúdo Craft.js se existir
          if (response.data.page.contentJson && Object.keys(response.data.page.contentJson).length > 0) {
            try {
              // Converter para string JSON se necessário
              const contentData = typeof response.data.page.contentJson === 'string'
                ? response.data.page.contentJson
                : JSON.stringify(response.data.page.contentJson)
              actions.deserialize(contentData)
            } catch (error) {
              console.error('Erro ao deserializar conteúdo:', error)
            }
          }
        }

        // Carregar componentes do template
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

  // Salvar página
  const handleSave = useCallback(async () => {
    if (!user?.storeId || !page) return

    try {
      setIsSaving(true)

      // Serializar conteúdo Craft.js
      const serializedContent = query.serialize()
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
  }, [user?.storeId, page, isNew, query, router])

  const handleUpdatePage = (updatedPage: Partial<DynamicPage>) => {
    if (page) {
      setPage({ ...page, ...updatedPage })
    }
  }

  return (
    <PreviewProvider>
      <Editor
        resolver={templateResolver}
        enabled={true}
      >
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
            {/* Left Panel - Navigation + Settings */}
            <div className="w-80 border-r border-border bg-surface flex flex-col">
              {/* Navigation */}
              <div className="flex-shrink-0">
                <TemplateSelector />
              </div>
              
              {/* Settings Panel */}
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
              {isLoading || !page ? (
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
          </div>
        </div>
      </Editor>
    </PreviewProvider>
  )
}

export default function PageEditorPage() {
  return (
    <Editor>
      <PageEditorContent />
    </Editor>
  )
}

