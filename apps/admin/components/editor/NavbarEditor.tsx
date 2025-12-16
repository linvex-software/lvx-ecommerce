'use client'

import { useState } from 'react'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { GripVertical, Plus, Trash2, Eye, EyeOff, Edit2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NavbarItem } from '@/lib/types/navbar'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface NavbarEditorProps {
  items?: NavbarItem[]
  onUpdate?: (items: NavbarItem[]) => void
  onNavbarUpdate?: (items: NavbarItem[]) => void // Mantido para compatibilidade
}

async function fetchNavbar(): Promise<{ navbar_items: NavbarItem[] }> {
  try {
    const response = await apiClient.get<{ navbar_items: NavbarItem[] }>('/admin/navbar')
    return response.data
  } catch (error) {
    console.warn('Erro ao buscar navbar, usando valores padrão:', error)
    return { navbar_items: [] }
  }
}

async function createNavbarItem(data: Partial<NavbarItem>): Promise<{ navbar_item: NavbarItem }> {
  const response = await apiClient.post<{ navbar_item: NavbarItem }>('/admin/navbar', data)
  return response.data
}

async function updateNavbarItem(id: string, data: Partial<NavbarItem>): Promise<{ navbar_item: NavbarItem }> {
  const response = await apiClient.put<{ navbar_item: NavbarItem }>(`/admin/navbar/${id}`, data)
  return response.data
}

async function deleteNavbarItem(id: string): Promise<void> {
  await apiClient.delete(`/admin/navbar/${id}`)
}

async function updateNavbarOrder(items: Array<{ id: string; order: number }>): Promise<void> {
  await apiClient.put('/admin/navbar/order', { items })
}

export function NavbarEditor({ items: externalItems, onUpdate, onNavbarUpdate }: NavbarEditorProps) {
  const onNavbarUpdateFinal = onUpdate || onNavbarUpdate
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [itemsOrder, setItemsOrder] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data, isLoading } = useQuery({
    queryKey: ['navbar'],
    queryFn: fetchNavbar
  })

  const createMutation = useMutation({
    mutationFn: createNavbarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Item adicionado!')
    },
    onError: () => {
      toast.error('Erro ao adicionar item')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NavbarItem> }) => updateNavbarItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Item atualizado!')
      setEditingId(null)
      if (onNavbarUpdate && data) {
        onNavbarUpdate(data.navbar_items)
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar item')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNavbarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Item removido!')
      if (onNavbarUpdate && data) {
        onNavbarUpdate(data.navbar_items.filter(item => item.id !== editingId))
      }
      setEditingId(null)
    },
    onError: () => {
      toast.error('Erro ao remover item')
    }
  })

  const orderMutation = useMutation({
    mutationFn: updateNavbarOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Ordem atualizada!')
      if (onNavbarUpdate && data) {
        onNavbarUpdate(data.navbar_items)
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar ordem')
    }
  })

  // Atualizar ordem local quando dados mudarem (apenas itens de primeiro nível)
  const updateItemsOrder = (items: NavbarItem[]) => {
    // Apenas itens de primeiro nível (sem parentId) podem ser reordenados
    const rootItems = items.filter(item => !item.parentId)
    setItemsOrder(rootItems.map(item => item.id))
  }

  // Handler para quando o drag termina
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = itemsOrder.indexOf(active.id as string)
    const newIndex = itemsOrder.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(itemsOrder, oldIndex, newIndex)
      setItemsOrder(newOrder)

      // Atualizar ordem no backend - apenas para itens de primeiro nível
      const orderUpdates = newOrder.map((id, index) => ({ id, order: index }))
      orderMutation.mutate(orderUpdates)
    }
  }

  const handleAddItem = () => {
    createMutation.mutate({
      label: 'Novo Item',
      type: 'internal',
      url: '/',
      visible: true,
      order: data?.navbar_items.length || 0
    })
  }

  const handleSave = (item: NavbarItem, formData: Partial<NavbarItem>) => {
    updateMutation.mutate({ id: item.id, data: formData })
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const flattenItems = (items: NavbarItem[]): NavbarItem[] => {
    const result: NavbarItem[] = []
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        result.push(...flattenItems(item.children))
      }
    })
    return result
  }

  const items = data?.navbar_items || []
  const rootItems = items.filter(item => !item.parentId)

  // Sincronizar ordem quando items mudarem - DEVE estar antes de qualquer early return
  React.useEffect(() => {
    if (rootItems.length > 0) {
      const currentRootIds = rootItems.map(item => item.id).sort()
      const orderRootIds = [...itemsOrder].sort()
      
      // Se não há ordem ou se há novos itens, atualizar
      if (itemsOrder.length === 0 || JSON.stringify(currentRootIds) !== JSON.stringify(orderRootIds)) {
        const newOrder = rootItems.map(item => item.id)
        setItemsOrder(newOrder)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.navbar_items?.length, rootItems.length])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando navbar...</div>
  }

  const flattenedItems = flattenItems(items)
  
  // Ordenar apenas itens de primeiro nível de acordo com itemsOrder
  const rootItemsSorted = itemsOrder.length > 0 && rootItems.length > 0
    ? itemsOrder
        .map(id => rootItems.find(item => item.id === id))
        .filter((item): item is NavbarItem => item !== undefined)
        .concat(rootItems.filter(item => !itemsOrder.includes(item.id)))
    : rootItems

  // Reconstruir estrutura hierárquica com ordem atualizada
  const sortedItems: NavbarItem[] = rootItemsSorted.map(rootItem => {
    const children = flattenedItems.filter(item => item.parentId === rootItem.id)
    return { ...rootItem, children }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Navbar</h3>
          <p className="text-sm text-muted-foreground">Gerencie os itens do menu de navegação. Arraste para reordenar.</p>
        </div>
        <Button size="sm" onClick={handleAddItem}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum item adicionado. Clique em "Adicionar Item" para começar.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemsOrder.length > 0 ? itemsOrder : rootItemsSorted.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedItems.map((item) => (
                <div key={item.id}>
                  <SortableNavbarItemEditor
                    item={item}
                    isEditing={editingId === item.id}
                    isExpanded={expandedItems.has(item.id)}
                    onEdit={() => setEditingId(item.id)}
                    onCancel={() => setEditingId(null)}
                    onSave={(formData) => handleSave(item, formData)}
                    onDelete={() => handleDelete(item.id)}
                    onToggleExpand={() => toggleExpanded(item.id)}
                    level={0}
                  />
                  {expandedItems.has(item.id) && item.children && item.children.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {item.children.map((child) => (
                        <NavbarItemEditor
                          key={child.id}
                          item={child}
                          isEditing={editingId === child.id}
                          isExpanded={expandedItems.has(child.id)}
                          onEdit={() => setEditingId(child.id)}
                          onCancel={() => setEditingId(null)}
                          onSave={(formData) => handleSave(child, formData)}
                          onDelete={() => handleDelete(child.id)}
                          onToggleExpand={() => toggleExpanded(child.id)}
                          level={1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

interface NavbarItemEditorProps {
  item: NavbarItem
  isEditing: boolean
  isExpanded: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<NavbarItem>) => void
  onDelete: () => void
  onToggleExpand: () => void
  level: number
}

function SortableNavbarItemEditor(props: NavbarItemEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}
    >
      <NavbarItemEditor {...props} dragHandleProps={{ ...attributes, ...listeners }} isDragging={isDragging} />
    </div>
  )
}

function NavbarItemEditor({
  item,
  isEditing,
  isExpanded,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onToggleExpand,
  level,
  dragHandleProps,
  isDragging = false
}: NavbarItemEditorProps & { 
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
  isDragging?: boolean
}) {
  const [formData, setFormData] = useState<Partial<NavbarItem>>({
    label: item.label,
    type: item.type,
    url: item.url,
    target: item.target,
    icon: item.icon,
    visible: item.visible,
    style: item.style
  })

  const hasChildren = item.children && item.children.length > 0

  if (isEditing) {
    return (
      <Card className="ml-4">
        <CardHeader>
          <CardTitle className="text-base">Editar Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              value={formData.type || 'internal'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as NavbarItem['type'] })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="internal">Link Interno</option>
              <option value="external">Link Externo</option>
              <option value="submenu">Submenu</option>
            </select>
          </div>

          {formData.type !== 'submenu' && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/products"
              />
            </div>
          )}

          {formData.type !== 'submenu' && (
            <div className="space-y-2">
              <Label>Target</Label>
              <select
                value={formData.target || '_self'}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as '_self' | '_blank' })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="_self">Mesma aba</option>
                <option value="_blank">Nova aba</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ícone (opcional)</Label>
            <Input
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="home, shopping-cart, etc"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`visible-${item.id}`}
              checked={formData.visible ?? true}
              onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor={`visible-${item.id}`} className="cursor-pointer">
              Visível
            </Label>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(formData)}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`
        ${level > 0 ? 'ml-8 border-l-2 border-l-primary/30' : ''} 
        ${isEditing ? 'ring-2 ring-primary' : ''}
        ${isDragging ? 'shadow-lg' : ''}
        transition-all duration-200
      `}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button 
              onClick={onToggleExpand} 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={isExpanded ? 'Recolher submenu' : 'Expandir submenu'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {!hasChildren && level === 0 && <div className="w-4" />}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded transition-colors"
              title="Arraste para reordenar"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </div>
          )}
          {!dragHandleProps && level > 0 && (
            <div className="w-6 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{item.label}</span>
              {!item.visible && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Oculto
                </span>
              )}
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.type === 'internal' ? 'Interno' : item.type === 'external' ? 'Externo' : 'Submenu'}
              </span>
              {level > 0 && (
                <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                  Submenu
                </span>
              )}
              {item.icon && (
                <span className="text-xs text-muted-foreground" title={`Ícone: ${item.icon}`}>
                  🎨
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onEdit} 
              className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted transition-colors"
              title="Editar item"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete} 
              className="text-destructive hover:text-destructive/80 p-1.5 rounded hover:bg-destructive/10 transition-colors"
              title="Remover item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

