'use client'

import { useState, useEffect } from 'react'
import { Editor } from '@craftjs/core'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { MenuTreeEditor } from '@/components/editor/menu/menu-tree-editor'
import { MenuSettingsPanel } from '@/components/editor/menu/menu-settings-panel'
import { TemplateSelector } from '@/components/editor/template-selector'
import { EditorTopbar } from '@/components/editor/editor-topbar'
import { PreviewProvider } from '@/components/editor/preview-context'
import { Button } from '@white-label/ui'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { NavbarItem } from '@/lib/types/navbar'

export default function MenuEditorPage() {
  const user = useAuthStore((state) => state.user)
  const [menuItems, setMenuItems] = useState<NavbarItem[]>([])
  const [selectedItem, setSelectedItem] = useState<NavbarItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Carregar itens do menu
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!user?.storeId) return

      try {
        setIsLoading(true)
        const response = await apiClient.get<{ navbar_items: NavbarItem[] }>('/admin/navbar')
        setMenuItems(response.data.navbar_items || [])
      } catch (error) {
        console.error('Erro ao carregar menu:', error)
        toast.error('Erro ao carregar itens do menu')
      } finally {
        setIsLoading(false)
      }
    }

    loadMenuItems()
  }, [user?.storeId])

  // Salvar itens do menu
  const handleSave = async () => {
    if (!user?.storeId) return

    try {
      setIsSaving(true)
      
      // Função auxiliar para verificar se é UUID válido
      const isValidUUID = (id: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(id)
      }

      // Mapa para rastrear IDs temporários -> IDs reais
      const idMap = new Map<string, string>()
      
      // Salvar cada item (incluindo hierarquia)
      const saveItems = async (items: NavbarItem[], parentId?: string | null) => {
        for (const item of items) {
          // Resolver parentId real se for temporário
          const realParentId = parentId && idMap.has(parentId) 
            ? idMap.get(parentId) 
            : (parentId && isValidUUID(parentId) ? parentId : null)

          const itemData = {
            ...item,
            id: undefined, // Remover ID temporário antes de enviar
            parentId: realParentId || null,
            children: undefined, // Remover children antes de salvar
            createdAt: undefined, // Backend gerencia isso
            updatedAt: undefined, // Backend gerencia isso
          }

          let realItemId: string

          // Verificar se é item novo (ID temporário ou inválido)
          if (!item.id || item.id.startsWith('temp-') || !isValidUUID(item.id)) {
            // Criar novo item
            const response = await apiClient.post<{ navbar_item: NavbarItem }>('/admin/navbar', itemData)
            realItemId = response.data.navbar_item.id
            
            // Mapear ID temporário para ID real
            if (item.id && item.id.startsWith('temp-')) {
              idMap.set(item.id, realItemId)
            }
          } else {
            // Atualizar item existente
            await apiClient.put(`/admin/navbar/${item.id}`, itemData)
            realItemId = item.id
          }

          // Salvar filhos recursivamente usando o ID real
          if (item.children && item.children.length > 0) {
            await saveItems(item.children, realItemId)
          }
        }
      }

      await saveItems(menuItems)
      
      toast.success('Menu salvo com sucesso!')
      
      // Recarregar itens
      const response = await apiClient.get<{ navbar_items: NavbarItem[] }>('/admin/navbar')
      setMenuItems(response.data.navbar_items || [])
      setSelectedItem(null) // Limpar seleção após salvar
    } catch (error) {
      console.error('Erro ao salvar menu:', error)
      toast.error('Erro ao salvar menu')
    } finally {
      setIsSaving(false)
    }
  }

  // Adicionar novo item
  const handleAddItem = (parentId?: string | null) => {
    const newItem: NavbarItem = {
      id: `temp-${Date.now()}`,
      storeId: user?.storeId || '',
      label: 'Novo Item',
      type: 'link',
      url: '/',
      target: '_self',
      visible: true,
      order: menuItems.length,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (parentId) {
      // Adicionar como filho
      const addToParent = (items: NavbarItem[]): NavbarItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
            }
          }
          if (item.children) {
            return {
              ...item,
              children: addToParent(item.children),
            }
          }
          return item
        })
      }
      setMenuItems(addToParent(menuItems))
    } else {
      // Adicionar como item raiz
      setMenuItems([...menuItems, newItem])
    }

    setSelectedItem(newItem)
  }

  // Atualizar item
  const handleUpdateItem = (updatedItem: NavbarItem) => {
    const updateInTree = (items: NavbarItem[]): NavbarItem[] => {
      return items.map(item => {
        if (item.id === updatedItem.id) {
          return updatedItem
        }
        if (item.children) {
          return {
            ...item,
            children: updateInTree(item.children),
          }
        }
        return item
      })
    }
    setMenuItems(updateInTree(menuItems))
    setSelectedItem(updatedItem)
  }

  // Deletar item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return

    try {
      // Deletar do servidor se tiver ID real
      if (!itemId.startsWith('temp-')) {
        await apiClient.delete(`/admin/navbar/${itemId}`)
      }

      // Remover da árvore
      const removeFromTree = (items: NavbarItem[]): NavbarItem[] => {
        return items
          .filter(item => item.id !== itemId)
          .map(item => ({
            ...item,
            children: item.children ? removeFromTree(item.children) : undefined,
          }))
      }
      setMenuItems(removeFromTree(menuItems))
      
      if (selectedItem?.id === itemId) {
        setSelectedItem(null)
      }

      toast.success('Item removido')
    } catch (error) {
      console.error('Erro ao deletar item:', error)
      toast.error('Erro ao remover item')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <PreviewProvider>
      <Editor
        resolver={{}}
        enabled={true}
      >
        <div className="flex h-screen flex-col bg-gray-50">
          <EditorTopbar isPreview={false} />
        
        {/* Menu Header com botão de salvar */}
        <div className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Menu / Navbar</h2>
              <p className="text-sm text-gray-500">Configure os itens de navegação da sua loja</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Menu
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Navigation + Tree Editor */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
            {/* Navigation */}
            <div className="flex-shrink-0">
              <TemplateSelector />
            </div>
            
            {/* Tree Editor */}
            <div className="flex-1 overflow-y-auto border-t border-gray-200">
              <MenuTreeEditor
                items={menuItems}
                selectedItem={selectedItem}
                onSelectItem={setSelectedItem}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onItemsChange={setMenuItems}
              />
            </div>
          </div>

          {/* Right Panel - Settings */}
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            {selectedItem ? (
              <MenuSettingsPanel
                item={selectedItem}
                onUpdate={handleUpdateItem}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Selecione um item para editar</p>
                  <p className="text-xs text-gray-400 mt-1">Clique em um item do menu à esquerda ou adicione um novo</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </Editor>
    </PreviewProvider>
  )
}

