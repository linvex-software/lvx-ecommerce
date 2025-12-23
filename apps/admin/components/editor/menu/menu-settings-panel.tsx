'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@white-label/ui'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { NavbarItem, NavbarItemConfig, NavbarItemVisibility } from '@/lib/types/navbar'

interface MenuSettingsPanelProps {
  item: NavbarItem
  onUpdate: (item: NavbarItem) => void
}

export function MenuSettingsPanel({ item, onUpdate }: MenuSettingsPanelProps) {
  const [formData, setFormData] = useState<Partial<NavbarItem>>(item)

  useEffect(() => {
    // Só atualizar se o item realmente mudou (por ID)
    // Isso evita sobrescrever mudanças locais quando o item é atualizado
    if (item.id !== formData.id) {
      setFormData(item)
    }
    // Se for o mesmo item, não sobrescrever para preservar mudanças locais do usuário
  }, [item.id])

  // Buscar categorias e páginas para os selects
  const { data: categoriesData } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/menu/categories')
      return response.data
    },
  })

  const { data: pagesData } = useQuery({
    queryKey: ['menu-pages'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/menu/pages')
      return response.data
    },
  })

  const handleUpdate = () => {
    const itemToSave = { ...formData }
    
    console.log('[MenuSettingsPanel] handleUpdate chamado:', {
      id: itemToSave.id,
      type: itemToSave.type,
      url: itemToSave.url,
      config: itemToSave.config,
      label: itemToSave.label,
      selectedOptionId: formData.config?.pageId
    })
    
    // Validar que se tipo é 'page', a URL deve estar presente e não ser apenas "/"
    if (itemToSave.type === 'page') {
      // Verificar se há uma página selecionada (pageId no config) OU se há uma URL válida
      const hasPageSelected = itemToSave.config?.pageId
      const hasValidUrl = itemToSave.url && itemToSave.url !== '/' && itemToSave.url.trim() !== ''
      
      console.log('[MenuSettingsPanel] Validação:', { hasPageSelected, hasValidUrl, url: itemToSave.url })
      
      if (!hasPageSelected && !hasValidUrl) {
        toast.error('Por favor, selecione uma página no campo "Página / Categoria / Rota"')
        return
      }
      
      // Se tem pageId mas não tem URL válida, tentar buscar a URL da página selecionada
      if (hasPageSelected && !hasValidUrl) {
        const selectedPage = pagesData?.pages?.find((p: any) => {
          return p.id === `dynamic-page-${itemToSave.config?.pageId}` ||
                 p.pageId === itemToSave.config?.pageId ||
                 p.id === itemToSave.config?.pageId
        })
        
        if (selectedPage) {
          const slug = selectedPage.slug?.startsWith('/') 
            ? selectedPage.slug 
            : `/${selectedPage.slug}`
          itemToSave.url = slug
          console.log('[MenuSettingsPanel] URL recuperada da página selecionada:', slug)
        } else {
          toast.error('Não foi possível encontrar a URL da página selecionada. Por favor, selecione novamente.')
          return
        }
      }
    }
    
    console.log('[MenuSettingsPanel] Salvando item final:', {
      id: itemToSave.id,
      type: itemToSave.type,
      url: itemToSave.url,
      config: itemToSave.config,
      label: itemToSave.label
    })
    
    onUpdate(itemToSave as NavbarItem)
  }

  const updateConfig = (config: Partial<NavbarItemConfig>) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        ...config,
      },
    })
  }

  const updateVisibility = (visibility: Partial<NavbarItemVisibility>) => {
    setFormData({
      ...formData,
      visibility: {
        ...formData.visibility,
        ...visibility,
      },
    })
  }

  const renderSettingsByType = () => {
    switch (formData.type) {
      case 'link':
      case 'internal':
      case 'external':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/products"
              />
            </div>
            <div>
              <Label>Abrir em nova aba</Label>
              <select
                value={formData.target || '_self'}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as '_self' | '_blank' })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="_self">Mesma aba</option>
                <option value="_blank">Nova aba</option>
              </select>
            </div>
          </div>
        )

      case 'category':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mostrar todas as categorias</Label>
              <input
                type="checkbox"
                checked={formData.config?.showAll ?? false}
                onChange={(e) => updateConfig({ showAll: e.target.checked })}
                className="ml-2"
              />
            </div>
            {!formData.config?.showAll && (
              <div>
                <Label>Categorias selecionadas</Label>
                <select
                  multiple
                  value={formData.config?.selectedCategories || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    updateConfig({ selectedCategories: selected })
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                >
                  {categoriesData?.categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Ordenação</Label>
              <select
                value={formData.config?.sortBy || 'alphabetical'}
                onChange={(e) => updateConfig({ sortBy: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="alphabetical">Alfabética</option>
                <option value="manual">Manual</option>
                <option value="featured">Por destaque</option>
              </select>
            </div>
            <div>
              <Label>Profundidade máxima</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.config?.maxDepth || 2}
                onChange={(e) => updateConfig({ maxDepth: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Tipo de exibição</Label>
              <select
                value={formData.config?.displayType || 'list'}
                onChange={(e) => updateConfig({ displayType: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="list">Lista</option>
                <option value="columns">Colunas</option>
                <option value="mega-menu">Mega Menu</option>
              </select>
            </div>
            <div>
              <Label>
                <input
                  type="checkbox"
                  checked={formData.config?.showImages ?? false}
                  onChange={(e) => updateConfig({ showImages: e.target.checked })}
                  className="mr-2"
                />
                Mostrar imagens
              </Label>
            </div>
            <div>
              <Label>
                <input
                  type="checkbox"
                  checked={formData.config?.onlyActive ?? false}
                  onChange={(e) => updateConfig({ onlyActive: e.target.checked })}
                  className="mr-2"
                />
                Apenas categorias ativas
              </Label>
            </div>
          </div>
        )

      case 'page':
        // Encontrar qual opção corresponde à URL atual
        const findSelectedOptionId = () => {
          if (!pagesData?.pages) return ''
          
          // Tentar encontrar por pageId primeiro (mais confiável)
          if (formData.config?.pageId) {
            const pageId = formData.config.pageId
            const foundById = pagesData.pages.find((p: any) => {
              // Pode ser o ID direto, pageId, ou categoryId
              return p.id === pageId || 
                     p.pageId === pageId ||
                     p.categoryId === pageId ||
                     // Para páginas dinâmicas, o ID no select é 'dynamic-page-${pageId}'
                     (p.type === 'dynamic-page' && p.pageId === pageId)
            })
            if (foundById) return foundById.id
          }
          
          // Tentar encontrar pela URL
          if (formData.url) {
            const foundByUrl = pagesData.pages.find((p: any) => {
              const pageSlug = p.slug?.startsWith('/') ? p.slug : `/${p.slug}`
              return pageSlug === formData.url || p.slug === formData.url
            })
            if (foundByUrl) return foundByUrl.id
          }
          
          return ''
        }
        
        const selectedOptionId = findSelectedOptionId()
        
        return (
          <div className="space-y-4">
            <div>
              <Label>Página / Categoria / Rota</Label>
              <select
                value={selectedOptionId}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  console.log('[MenuSettingsPanel] Select onChange:', { 
                    selectedValue, 
                    pagesCount: pagesData?.pages?.length,
                    currentUrl: formData.url,
                    currentConfig: formData.config
                  })
                  
                  if (!selectedValue) {
                    // Se nenhuma opção foi selecionada, limpar tudo
                    setFormData((prev) => ({ 
                      ...prev, 
                      url: '',
                      config: {
                        ...prev.config,
                        pageId: undefined
                      }
                    }))
                    return
                  }
                  
                  const selectedOption = pagesData?.pages?.find((p: any) => p.id === selectedValue)
                  console.log('[MenuSettingsPanel] Selected option:', selectedOption)
                  
                  if (selectedOption) {
                    // Garantir que o slug tenha a barra inicial
                    const slug = selectedOption.slug?.startsWith('/') 
                      ? selectedOption.slug 
                      : `/${selectedOption.slug}`
                    
                    console.log('[MenuSettingsPanel] Updating URL with slug:', slug, 'from option:', selectedOption.slug)
                    
                    // Determinar o pageId baseado no tipo
                    let pageId: string | undefined = undefined
                    if (selectedOption.type === 'page' || selectedOption.type === 'dynamic-page') {
                      // Para páginas dinâmicas, usar pageId se disponível, senão extrair do ID
                      pageId = selectedOption.pageId || 
                               (selectedOption.type === 'dynamic-page' && selectedOption.id.startsWith('dynamic-page-')
                                 ? selectedOption.id.replace('dynamic-page-', '')
                                 : selectedOption.id)
                    } else if (selectedOption.type === 'category') {
                      pageId = selectedOption.categoryId || selectedOption.id
                    }
                    
                    console.log('[MenuSettingsPanel] Updating with:', { slug, pageId, type: selectedOption.type })
                    
                    // Atualizar URL e config de forma síncrona em uma única chamada
                    setFormData((prev) => ({
                      ...prev,
                      url: slug,
                      config: {
                        ...prev.config,
                        pageId: pageId
                      }
                    }))
                  } else {
                    console.warn('[MenuSettingsPanel] Selected option not found for value:', selectedValue)
                    // Se nenhuma opção foi encontrada, limpar tudo
                    setFormData((prev) => ({ 
                      ...prev, 
                      url: '',
                      config: {
                        ...prev.config,
                        pageId: undefined
                      }
                    }))
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione uma opção</option>
                {pagesData?.pages?.map((page: any) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-secondary mt-1">
                Você pode escolher entre rotas pré-definidas, categorias ou páginas institucionais
              </p>
            </div>
            <div>
              <Label>URL Final (usada no redirect)</Label>
              <Input
                value={formData.url || ''}
                readOnly
                className="bg-surface-2 font-mono text-sm"
                placeholder="Selecione uma página acima"
              />
              <p className="text-xs text-text-secondary mt-1">
                Esta é a URL que será usada quando o usuário clicar no item do menu.
                {!formData.url && ' Selecione uma página acima para preencher automaticamente.'}
              </p>
            </div>
          </div>
        )

      case 'dynamic-list':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de lista</Label>
              <select
                value={formData.config?.listType || 'featured'}
                onChange={(e) => updateConfig({ listType: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="featured">Produtos em destaque</option>
                <option value="on-sale">Em oferta</option>
                <option value="best-sellers">Mais vendidos</option>
                <option value="new-arrivals">Lançamentos</option>
              </select>
            </div>
            <div>
              <Label>Limite de produtos</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.config?.limit || 10}
                onChange={(e) => updateConfig({ limit: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )

      case 'custom-block':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de bloco</Label>
              <select
                value={formData.config?.blockType || 'banner'}
                onChange={(e) => updateConfig({ blockType: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="banner">Banner</option>
                <option value="image">Imagem</option>
                <option value="product-card">Card de Produto</option>
                <option value="cta">CTA (Call to Action)</option>
              </select>
            </div>
            {/* Configurações específicas de cada tipo de bloco podem ser adicionadas aqui */}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Configurações do Item</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Configurações básicas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Básico</h3>
          
          <div>
            <Label>Texto do item</Label>
            <Input
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Nome do item"
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <select
              value={formData.type || 'link'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as NavbarItem['type'] })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="link">Link Simples</option>
              <option value="internal">Link Interno</option>
              <option value="external">Link Externo</option>
              <option value="category">Categorias</option>
              <option value="page">Página</option>
              <option value="dynamic-list">Lista Dinâmica</option>
              <option value="custom-block">Bloco Visual</option>
              <option value="submenu">Submenu</option>
            </select>
          </div>

          <div>
            <Label>Ícone (opcional)</Label>
            <Input
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="home, shopping-cart, etc"
            />
          </div>

          <div>
            <Label>
              <input
                type="checkbox"
                checked={formData.visible ?? true}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="mr-2"
              />
              Visível
            </Label>
          </div>
        </div>

        {/* Configurações específicas do tipo */}
        {formData.type && formData.type !== 'submenu' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Configurações do Tipo</h3>
            {renderSettingsByType()}
          </div>
        )}

        {/* Visibilidade por breakpoint */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Visibilidade</h3>
          
          <div>
            <Label>
              <input
                type="checkbox"
                checked={formData.visibility?.desktop ?? true}
                onChange={(e) => updateVisibility({ desktop: e.target.checked })}
                className="mr-2"
              />
              Desktop
            </Label>
          </div>
          <div>
            <Label>
              <input
                type="checkbox"
                checked={formData.visibility?.tablet ?? true}
                onChange={(e) => updateVisibility({ tablet: e.target.checked })}
                className="mr-2"
              />
              Tablet
            </Label>
          </div>
          <div>
            <Label>
              <input
                type="checkbox"
                checked={formData.visibility?.mobile ?? true}
                onChange={(e) => updateVisibility({ mobile: e.target.checked })}
                className="mr-2"
              />
              Mobile
            </Label>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4">
        <Button onClick={handleUpdate} className="w-full">
          Salvar Alterações
        </Button>
      </div>
    </div>
  )
}

